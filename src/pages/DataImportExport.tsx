import { useState, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuditLogger } from "@/hooks/useAuditLogger";
import { DashboardNavbar } from "@/components/layout/DashboardNavbar";
import { DashboardNav } from "@/components/layout/DashboardNav";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Upload, 
  Download, 
  FileSpreadsheet, 
  Users, 
  UserPlus, 
  DollarSign,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Trash2,
  RefreshCw,
  FileDown,
  Building2
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Navigate } from "react-router-dom";

type EntityType = "contacts" | "leads" | "deals" | "companies";

interface ColumnMapping {
  csvColumn: string;
  dbColumn: string;
}

interface ImportPreview {
  headers: string[];
  rows: string[][];
  mappings: ColumnMapping[];
}

// Security constants
const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const MAX_ROWS_PER_IMPORT = 1000;

// Sanitize CSV cell to prevent formula injection attacks
const sanitizeCSVCell = (value: string): string => {
  if (!value || typeof value !== 'string') return value;
  // Prefix with apostrophe if starts with formula characters
  if (/^[=+\-@\t\r]/.test(value)) {
    return "'" + value;
  }
  return value.trim();
};

// Field validation schemas
const emailSchema = z.string().email().max(255).optional().or(z.literal(''));
const phoneSchema = z.string().max(50).regex(/^[\d\s\-\+\(\)\.]*$/, "Invalid phone format").optional().or(z.literal(''));
const urlSchema = z.string().url().max(500).optional().or(z.literal(''));
const textSchema = z.string().max(1000);
const shortTextSchema = z.string().max(255);

// Validate and sanitize a field based on its type
const validateField = (value: string, fieldName: string): { valid: boolean; sanitized: string; error?: string } => {
  const sanitized = sanitizeCSVCell(value);
  
  if (!sanitized) {
    return { valid: true, sanitized };
  }
  
  try {
    switch (fieldName) {
      case 'email':
        emailSchema.parse(sanitized);
        break;
      case 'phone':
        phoneSchema.parse(sanitized);
        break;
      case 'website':
        urlSchema.parse(sanitized);
        break;
      case 'notes':
        textSchema.parse(sanitized);
        break;
      default:
        shortTextSchema.parse(sanitized);
    }
    return { valid: true, sanitized };
  } catch (err) {
    if (err instanceof z.ZodError) {
      return { valid: false, sanitized, error: err.errors[0]?.message || 'Invalid value' };
    }
    return { valid: false, sanitized, error: 'Validation failed' };
  }
};

const ENTITY_CONFIGS: Record<EntityType, { 
  label: string; 
  icon: React.ElementType; 
  requiredFields: string[];
  optionalFields: string[];
  color: string;
}> = {
  contacts: {
    label: "Contacts",
    icon: Users,
    requiredFields: ["first_name", "last_name"],
    optionalFields: ["email", "phone", "title", "notes"],
    color: "bg-blue-500/10 text-blue-600",
  },
  leads: {
    label: "Leads",
    icon: UserPlus,
    requiredFields: ["first_name", "last_name"],
    optionalFields: ["email", "phone", "company", "title", "source", "status", "notes"],
    color: "bg-emerald-500/10 text-emerald-600",
  },
  deals: {
    label: "Deals",
    icon: DollarSign,
    requiredFields: ["title"],
    optionalFields: ["value", "stage", "probability", "close_date", "notes"],
    color: "bg-purple-500/10 text-purple-600",
  },
  companies: {
    label: "Companies",
    icon: Building2,
    requiredFields: ["name"],
    optionalFields: ["website", "industry", "size", "phone", "address", "notes"],
    color: "bg-amber-500/10 text-amber-600",
  },
};

const DataImportExport = () => {
  const { user } = useAuth();
  const { permissions, loading: rolesLoading } = useUserRole();
  const { logDataExport, logDataImport } = useAuditLogger();
  const queryClient = useQueryClient();
  
  // Import state
  const [importEntity, setImportEntity] = useState<EntityType>("contacts");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null);
  const [importStep, setImportStep] = useState<"upload" | "mapping" | "preview" | "importing" | "complete">("upload");
  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState<{ success: number; failed: number; errors: string[] }>({ success: 0, failed: 0, errors: [] });
  
  // Export state
  const [exportEntity, setExportEntity] = useState<EntityType>("contacts");
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);

  // Parse CSV file
  const parseCSV = useCallback((text: string): { headers: string[]; rows: string[][] } => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length === 0) return { headers: [], rows: [] };
    
    const parseRow = (row: string): string[] => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < row.length; i++) {
        const char = row[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };
    
    const headers = parseRow(lines[0]);
    const rows = lines.slice(1).map(parseRow).filter(row => row.some(cell => cell));
    
    return { headers, rows };
  }, []);

  // Handle file upload with security validations
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Validate file extension
    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast.error("Please upload a CSV file");
      return;
    }
    
    // Security: Validate file size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      toast.error(`File too large. Maximum size is ${MAX_FILE_SIZE_MB}MB`);
      return;
    }
    
    setCsvFile(file);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const { headers, rows } = parseCSV(text);
      
      if (headers.length === 0) {
        toast.error("Could not parse CSV file");
        return;
      }
      
      // Security: Validate row count
      if (rows.length > MAX_ROWS_PER_IMPORT) {
        toast.error(`File has ${rows.length} rows. Maximum allowed is ${MAX_ROWS_PER_IMPORT} rows per import.`);
        return;
      }
      
      // Auto-map columns
      const config = ENTITY_CONFIGS[importEntity];
      const allFields = [...config.requiredFields, ...config.optionalFields];
      const mappings: ColumnMapping[] = headers.map(header => {
        const normalized = header.toLowerCase().replace(/[^a-z]/g, '_');
        const match = allFields.find(f => 
          f === normalized || 
          f.includes(normalized) || 
          normalized.includes(f)
        );
        return { csvColumn: header, dbColumn: match || "" };
      });
      
      setImportPreview({ headers, rows: rows.slice(0, 100), mappings });
      setImportStep("mapping");
    };
    reader.readAsText(file);
  }, [importEntity, parseCSV]);

  // Update column mapping
  const updateMapping = useCallback((csvColumn: string, dbColumn: string) => {
    if (!importPreview) return;
    setImportPreview({
      ...importPreview,
      mappings: importPreview.mappings.map(m => 
        m.csvColumn === csvColumn ? { ...m, dbColumn } : m
      ),
    });
  }, [importPreview]);

  // Validate mappings
  const validateMappings = useCallback((): boolean => {
    if (!importPreview) return false;
    const config = ENTITY_CONFIGS[importEntity];
    const mappedFields = importPreview.mappings.filter(m => m.dbColumn).map(m => m.dbColumn);
    return config.requiredFields.every(f => mappedFields.includes(f));
  }, [importPreview, importEntity]);

  // Import data mutation with validation and sanitization
  const importMutation = useMutation({
    mutationFn: async () => {
      if (!importPreview || !user) throw new Error("No data to import");
      
      const mappings = importPreview.mappings.filter(m => m.dbColumn);
      const results = { success: 0, failed: 0, errors: [] as string[] };
      
      // Re-read full file for import
      const text = await csvFile!.text();
      const { rows: allRows } = parseCSV(text);
      
      // Security: Enforce row limit during import
      const rowsToImport = allRows.slice(0, MAX_ROWS_PER_IMPORT);
      if (allRows.length > MAX_ROWS_PER_IMPORT) {
        toast.warning(`Importing first ${MAX_ROWS_PER_IMPORT} rows only. File contains ${allRows.length} rows.`);
      }
      
      setImportStep("importing");
      
      for (let i = 0; i < rowsToImport.length; i++) {
        const row = rowsToImport[i];
        const record: Record<string, unknown> = { user_id: user.id };
        let hasValidationError = false;
        
        for (const { csvColumn, dbColumn } of mappings) {
          const colIndex = importPreview.headers.indexOf(csvColumn);
          if (colIndex >= 0 && row[colIndex]) {
            const rawValue = row[colIndex];
            
            // Security: Validate and sanitize field
            const { valid, sanitized, error } = validateField(rawValue, dbColumn);
            if (!valid) {
              hasValidationError = true;
              results.failed++;
              if (results.errors.length < 5) {
                results.errors.push(`Row ${i + 2}, ${dbColumn}: ${error}`);
              }
              break;
            }
            
            let value: unknown = sanitized;
            
            // Type conversions
            if (dbColumn === "value" || dbColumn === "probability" || dbColumn === "score") {
              const parsed = parseFloat(sanitized);
              if (isNaN(parsed) || parsed < 0 || parsed > 999999999) {
                value = 0;
              } else {
                value = parsed;
              }
            }
            if (dbColumn === "close_date") {
              const date = new Date(sanitized);
              value = isNaN(date.getTime()) ? null : date.toISOString().split('T')[0];
            }
            
            record[dbColumn] = value;
          }
        }
        
        if (hasValidationError) {
          setImportProgress(Math.round(((i + 1) / rowsToImport.length) * 100));
          continue;
        }
        
        try {
          const { error } = await supabase.from(importEntity).insert(record as any);
          if (error) {
            results.failed++;
            if (results.errors.length < 5) {
              results.errors.push(`Row ${i + 2}: ${error.message}`);
            }
          } else {
            results.success++;
          }
        } catch (err) {
          results.failed++;
        }
        
        setImportProgress(Math.round(((i + 1) / rowsToImport.length) * 100));
      }
      
      return results;
    },
    onSuccess: (results) => {
      setImportResults(results);
      setImportStep("complete");
      queryClient.invalidateQueries({ queryKey: [importEntity] });
      
      // Log the import to audit trail
      logDataImport(importEntity, results.success, results.failed, csvFile?.name);
      
      toast.success(`Imported ${results.success} records`);
    },
    onError: (error) => {
      toast.error("Import failed: " + error.message);
      setImportStep("preview");
    },
  });

  // Export data
  const handleExport = async () => {
    if (!user || selectedFields.length === 0) return;
    
    setIsExporting(true);
    
    try {
      const { data, error } = await supabase
        .from(exportEntity)
        .select(selectedFields.join(','))
        .limit(10000);
      
      if (error) throw error;
      
      if (!data || data.length === 0) {
        toast.error("No data to export");
        setIsExporting(false);
        return;
      }
      
      // Generate CSV
      const headers = selectedFields;
      const rows = data.map(row => 
        headers.map(h => {
          const value = (row as unknown as Record<string, unknown>)[h];
          if (value === null || value === undefined) return "";
          const str = String(value);
          return str.includes(',') || str.includes('"') || str.includes('\n') 
            ? `"${str.replace(/"/g, '""')}"` 
            : str;
        })
      );
      
      const csvContent = [
        headers.join(','),
        ...rows.map(r => r.join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `${exportEntity}-export-${format(new Date(), "yyyy-MM-dd")}.csv`;
      link.click();
      
      // Log the export to audit trail
      await logDataExport(exportEntity, data.length, selectedFields);
      
      toast.success(`Exported ${data.length} ${exportEntity}`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      toast.error("Export failed: " + errorMessage);
    } finally {
      setIsExporting(false);
    }
  };

  // Reset import
  const resetImport = () => {
    setCsvFile(null);
    setImportPreview(null);
    setImportStep("upload");
    setImportProgress(0);
    setImportResults({ success: 0, failed: 0, errors: [] });
  };

  // Get all fields for export entity
  const getExportFields = () => {
    const config = ENTITY_CONFIGS[exportEntity];
    return ["id", "created_at", ...config.requiredFields, ...config.optionalFields];
  };

  if (rolesLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // Check export permission
  if (!permissions.canExportData) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardNavbar />
      <DashboardNav />
      
      <main className="pl-64 pt-16">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <FileSpreadsheet className="w-8 h-8 text-primary" />
              Data Import / Export
            </h1>
            <p className="text-muted-foreground">Bulk import and export your CRM data</p>
          </div>

          <Tabs defaultValue="import" className="space-y-6">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="import" className="gap-2">
                <Upload className="w-4 h-4" />
                Import
              </TabsTrigger>
              <TabsTrigger value="export" className="gap-2">
                <Download className="w-4 h-4" />
                Export
              </TabsTrigger>
            </TabsList>

            {/* Import Tab */}
            <TabsContent value="import" className="space-y-6">
              {/* Entity Selection */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {(Object.entries(ENTITY_CONFIGS) as [EntityType, typeof ENTITY_CONFIGS.contacts][]).map(([key, config]) => {
                  const Icon = config.icon;
                  return (
                    <Card 
                      key={key}
                      className={`cursor-pointer transition-all hover:shadow-md ${importEntity === key ? 'ring-2 ring-primary' : ''}`}
                      onClick={() => {
                        setImportEntity(key);
                        if (importStep !== "upload") resetImport();
                      }}
                    >
                      <CardContent className="pt-6 text-center">
                        <div className={`w-12 h-12 rounded-full ${config.color} flex items-center justify-center mx-auto mb-3`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <p className="font-medium">{config.label}</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Import Steps */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="w-5 h-5 text-primary" />
                    Import {ENTITY_CONFIGS[importEntity].label}
                  </CardTitle>
                  <CardDescription>
                    Upload a CSV file to import {importEntity}. Required fields: {ENTITY_CONFIGS[importEntity].requiredFields.join(", ")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Step 1: Upload */}
                  {importStep === "upload" && (
                    <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                      <FileSpreadsheet className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">Upload CSV File</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Drag and drop or click to select a CSV file
                      </p>
                      <Input
                        type="file"
                        accept=".csv"
                        onChange={handleFileUpload}
                        className="max-w-xs mx-auto"
                      />
                    </div>
                  )}

                  {/* Step 2: Column Mapping */}
                  {importStep === "mapping" && importPreview && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">Map Columns</h3>
                          <p className="text-sm text-muted-foreground">
                            Match CSV columns to {importEntity} fields
                          </p>
                        </div>
                        <Badge variant="secondary">{importPreview.rows.length} rows found</Badge>
                      </div>

                      <div className="border rounded-lg overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>CSV Column</TableHead>
                              <TableHead>Sample Data</TableHead>
                              <TableHead>Map To</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {importPreview.mappings.map((mapping, idx) => (
                              <TableRow key={mapping.csvColumn}>
                                <TableCell className="font-medium">{mapping.csvColumn}</TableCell>
                                <TableCell className="text-muted-foreground max-w-[200px] truncate">
                                  {importPreview.rows[0]?.[idx] || "-"}
                                </TableCell>
                                <TableCell>
                                  <Select
                                    value={mapping.dbColumn || "skip"}
                                    onValueChange={(v) => updateMapping(mapping.csvColumn, v === "skip" ? "" : v)}
                                  >
                                    <SelectTrigger className="w-40">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="skip">Skip</SelectItem>
                                      {[...ENTITY_CONFIGS[importEntity].requiredFields, ...ENTITY_CONFIGS[importEntity].optionalFields].map(field => (
                                        <SelectItem key={field} value={field}>
                                          {field.replace(/_/g, ' ')}
                                          {ENTITY_CONFIGS[importEntity].requiredFields.includes(field) && " *"}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>

                      {!validateMappings() && (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle>Missing Required Fields</AlertTitle>
                          <AlertDescription>
                            Please map all required fields: {ENTITY_CONFIGS[importEntity].requiredFields.join(", ")}
                          </AlertDescription>
                        </Alert>
                      )}

                      <div className="flex gap-3">
                        <Button variant="outline" onClick={resetImport}>
                          <Trash2 className="w-4 h-4 mr-2" />
                          Start Over
                        </Button>
                        <Button 
                          onClick={() => setImportStep("preview")} 
                          disabled={!validateMappings()}
                        >
                          Preview Import
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Preview */}
                  {importStep === "preview" && importPreview && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">Preview Import</h3>
                          <p className="text-sm text-muted-foreground">
                            Review the first 5 rows before importing
                          </p>
                        </div>
                        <Badge variant="secondary">{importPreview.rows.length} rows to import</Badge>
                      </div>

                      <div className="border rounded-lg overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              {importPreview.mappings.filter(m => m.dbColumn).map(m => (
                                <TableHead key={m.dbColumn}>{m.dbColumn.replace(/_/g, ' ')}</TableHead>
                              ))}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {importPreview.rows.slice(0, 5).map((row, rowIdx) => (
                              <TableRow key={rowIdx}>
                                {importPreview.mappings.filter(m => m.dbColumn).map(m => {
                                  const colIdx = importPreview.headers.indexOf(m.csvColumn);
                                  return (
                                    <TableCell key={m.dbColumn} className="max-w-[150px] truncate">
                                      {row[colIdx] || "-"}
                                    </TableCell>
                                  );
                                })}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>

                      <div className="flex gap-3">
                        <Button variant="outline" onClick={() => setImportStep("mapping")}>
                          Back to Mapping
                        </Button>
                        <Button onClick={() => importMutation.mutate()}>
                          <Upload className="w-4 h-4 mr-2" />
                          Import {importPreview.rows.length} Records
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Step 4: Importing */}
                  {importStep === "importing" && (
                    <div className="text-center py-8">
                      <RefreshCw className="w-12 h-12 text-primary mx-auto mb-4 animate-spin" />
                      <h3 className="text-lg font-medium mb-2">Importing...</h3>
                      <p className="text-sm text-muted-foreground mb-4">Please wait while we import your data</p>
                      <Progress value={importProgress} className="max-w-md mx-auto" />
                      <p className="text-sm text-muted-foreground mt-2">{importProgress}% complete</p>
                    </div>
                  )}

                  {/* Step 5: Complete */}
                  {importStep === "complete" && (
                    <div className="text-center py-8">
                      <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">Import Complete!</h3>
                      <div className="flex justify-center gap-6 mb-4">
                        <div>
                          <p className="text-2xl font-bold text-green-600">{importResults.success}</p>
                          <p className="text-sm text-muted-foreground">Successful</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-red-600">{importResults.failed}</p>
                          <p className="text-sm text-muted-foreground">Failed</p>
                        </div>
                      </div>
                      
                      {importResults.errors.length > 0 && (
                        <Alert variant="destructive" className="max-w-md mx-auto text-left mb-4">
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle>Some imports failed</AlertTitle>
                          <AlertDescription>
                            <ul className="list-disc list-inside text-sm mt-2">
                              {importResults.errors.map((e, i) => <li key={i}>{e}</li>)}
                            </ul>
                          </AlertDescription>
                        </Alert>
                      )}
                      
                      <Button onClick={resetImport}>
                        Import More Data
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Export Tab */}
            <TabsContent value="export" className="space-y-6">
              {/* Entity Selection */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {(Object.entries(ENTITY_CONFIGS) as [EntityType, typeof ENTITY_CONFIGS.contacts][]).map(([key, config]) => {
                  const Icon = config.icon;
                  return (
                    <Card 
                      key={key}
                      className={`cursor-pointer transition-all hover:shadow-md ${exportEntity === key ? 'ring-2 ring-primary' : ''}`}
                      onClick={() => {
                        setExportEntity(key);
                        setSelectedFields([]);
                      }}
                    >
                      <CardContent className="pt-6 text-center">
                        <div className={`w-12 h-12 rounded-full ${config.color} flex items-center justify-center mx-auto mb-3`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <p className="font-medium">{config.label}</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Download className="w-5 h-5 text-primary" />
                    Export {ENTITY_CONFIGS[exportEntity].label}
                  </CardTitle>
                  <CardDescription>
                    Select the fields you want to include in the export
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Select Fields to Export</Label>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedFields(getExportFields())}
                        >
                          Select All
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedFields([])}
                        >
                          Clear
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {getExportFields().map(field => (
                        <div key={field} className="flex items-center gap-2">
                          <Checkbox
                            id={field}
                            checked={selectedFields.includes(field)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedFields([...selectedFields, field]);
                              } else {
                                setSelectedFields(selectedFields.filter(f => f !== field));
                              }
                            }}
                          />
                          <Label htmlFor={field} className="text-sm cursor-pointer">
                            {field.replace(/_/g, ' ')}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button 
                    onClick={handleExport} 
                    disabled={selectedFields.length === 0 || isExporting}
                    className="gap-2"
                  >
                    {isExporting ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <FileDown className="w-4 h-4" />
                    )}
                    {isExporting ? "Exporting..." : `Export ${ENTITY_CONFIGS[exportEntity].label} to CSV`}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default DataImportExport;

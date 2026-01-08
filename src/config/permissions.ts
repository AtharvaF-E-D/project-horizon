import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

export interface Permission {
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export interface RolePermissions {
  // Navigation access
  dashboard: boolean;
  leads: boolean;
  pipeline: boolean;
  deals: boolean;
  contacts: boolean;
  companies: boolean;
  tasks: boolean;
  campaigns: boolean;
  campaignAnalytics: boolean;
  segments: boolean;
  sequences: boolean;
  subscribers: boolean;
  emailTemplates: boolean;
  auditLogs: boolean;
  dataImportExport: boolean;
  whatsapp: boolean;
  calls: boolean;
  reports: boolean;
  analytics: boolean;
  aiAssistant: boolean;
  roles: boolean;
  team: boolean;
  settings: boolean;
  
  // Feature permissions
  canManageRoles: boolean;
  canViewAllData: boolean;
  canExportData: boolean;
  canDeleteRecords: boolean;
  canManageTeam: boolean;
  canEditSettings: boolean;
  canCreateCampaigns: boolean;
  canSendEmails: boolean;
}

const OWNER_PERMISSIONS: RolePermissions = {
  dashboard: true,
  leads: true,
  pipeline: true,
  deals: true,
  contacts: true,
  companies: true,
  tasks: true,
  campaigns: true,
  campaignAnalytics: true,
  segments: true,
  sequences: true,
  subscribers: true,
  emailTemplates: true,
  auditLogs: true,
  dataImportExport: true,
  whatsapp: true,
  calls: true,
  reports: true,
  analytics: true,
  aiAssistant: true,
  roles: true,
  team: true,
  settings: true,
  canManageRoles: true,
  canViewAllData: true,
  canExportData: true,
  canDeleteRecords: true,
  canManageTeam: true,
  canEditSettings: true,
  canCreateCampaigns: true,
  canSendEmails: true,
};

const ADMIN_PERMISSIONS: RolePermissions = {
  ...OWNER_PERMISSIONS,
};

const MANAGER_PERMISSIONS: RolePermissions = {
  dashboard: true,
  leads: true,
  pipeline: true,
  deals: true,
  contacts: true,
  companies: true,
  tasks: true,
  campaigns: true,
  campaignAnalytics: true,
  segments: true,
  sequences: true,
  subscribers: true,
  emailTemplates: true,
  auditLogs: false,
  dataImportExport: true,
  whatsapp: true,
  calls: true,
  reports: true,
  analytics: true,
  aiAssistant: true,
  roles: false,
  team: true,
  settings: false,
  canManageRoles: false,
  canViewAllData: true,
  canExportData: true,
  canDeleteRecords: true,
  canManageTeam: true,
  canEditSettings: false,
  canCreateCampaigns: true,
  canSendEmails: true,
};

const AGENT_PERMISSIONS: RolePermissions = {
  dashboard: true,
  leads: true,
  pipeline: true,
  deals: true,
  contacts: true,
  companies: true,
  tasks: true,
  campaigns: false,
  campaignAnalytics: false,
  segments: false,
  sequences: false,
  subscribers: false,
  emailTemplates: true,
  auditLogs: false,
  dataImportExport: false,
  whatsapp: true,
  calls: true,
  reports: false,
  analytics: false,
  aiAssistant: true,
  roles: false,
  team: false,
  settings: false,
  canManageRoles: false,
  canViewAllData: false,
  canExportData: false,
  canDeleteRecords: true,
  canManageTeam: false,
  canEditSettings: false,
  canCreateCampaigns: false,
  canSendEmails: false,
};

const VIEWER_PERMISSIONS: RolePermissions = {
  dashboard: true,
  leads: true,
  pipeline: true,
  deals: true,
  contacts: true,
  companies: true,
  tasks: true,
  campaigns: true,
  campaignAnalytics: true,
  segments: true,
  sequences: true,
  subscribers: true,
  emailTemplates: true,
  auditLogs: false,
  dataImportExport: false,
  whatsapp: false,
  calls: false,
  reports: true,
  analytics: true,
  aiAssistant: false,
  roles: false,
  team: true,
  settings: false,
  canManageRoles: false,
  canViewAllData: true,
  canExportData: false,
  canDeleteRecords: false,
  canManageTeam: false,
  canEditSettings: false,
  canCreateCampaigns: false,
  canSendEmails: false,
};

export const ROLE_PERMISSIONS: Record<AppRole, RolePermissions> = {
  owner: OWNER_PERMISSIONS,
  admin: ADMIN_PERMISSIONS,
  manager: MANAGER_PERMISSIONS,
  agent: AGENT_PERMISSIONS,
  viewer: VIEWER_PERMISSIONS,
};

export const getPermissions = (role: AppRole | null): RolePermissions => {
  if (!role) return VIEWER_PERMISSIONS;
  return ROLE_PERMISSIONS[role] || VIEWER_PERMISSIONS;
};

// Route to permission key mapping
export const ROUTE_PERMISSIONS: Record<string, keyof RolePermissions> = {
  "/dashboard": "dashboard",
  "/leads": "leads",
  "/pipeline": "pipeline",
  "/deals": "deals",
  "/contacts": "contacts",
  "/companies": "companies",
  "/tasks": "tasks",
  "/campaigns": "campaigns",
  "/campaign-analytics": "campaignAnalytics",
  "/segments": "segments",
  "/sequences": "sequences",
  "/subscribers": "subscribers",
  "/email-templates": "emailTemplates",
  "/audit-logs": "auditLogs",
  "/data-import-export": "dataImportExport",
  "/whatsapp": "whatsapp",
  "/calls": "calls",
  "/reports": "reports",
  "/analytics": "analytics",
  "/ai-assistant": "aiAssistant",
  "/roles": "roles",
  "/team": "team",
  "/settings": "settings",
};

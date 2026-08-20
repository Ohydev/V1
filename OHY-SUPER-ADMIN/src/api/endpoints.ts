// Export a centralized map of backend endpoint strings.
export const endpoints = {
  // Endpoint to authenticate the super admin user.
  superAdminLogin: "/super_admin_login",
  // Endpoint to fetch the authenticated super admin profile.
  superAdminProfile: "/get_super_admin_profile",
  // Endpoint to update the authenticated super admin profile.
  updateSuperAdminProfile: "/update_super_admin_profile",
  // Endpoint to retrieve dashboard statistics for super admin.
  superAdminDashboard: "/get_super_admin_dashboard",
  // Endpoint to fetch paginated super admin events list.
  superAdminEvents: "/get_super_admin_events_list",
  // Endpoint to fetch a detailed single event record for the super admin.
  superAdminEventDetails: "/get_super_admin_event_details",
  // Endpoint to fetch paginated event hosts list for the super admin.
  superAdminEventHosts: "/get_super_admin_event_hosts_list",
  // Endpoint to retrieve business intersections for filter dropdowns.
  getBusinessIntersections: "/get_business_intersections",
  // Endpoint to retrieve event categories for filter dropdowns.
  getEventCategories: "/get_event_categories",
  // Endpoint to fetch paginated attendees list for the super admin.
  superAdminAttendees: "/get_super_admin_attendees_list",
  // Endpoint to fetch paginated user submitted reports list for the super admin.
  superAdminReportsList: "/get_super_admin_reports_list",
  // Endpoint to fetch paginated super admin feedbacks list.
  superAdminFeedbacksList: "/get_super_admin_feedbacks_list",
  // Endpoint to fetch paginated super admin support requests list.
  superAdminSupportRequestsList: "/get_super_admin_support_requests_list",
  // Endpoint to update report status (new, in_review, resolved).
  updateSuperAdminReportStatus: "/update_report_status",
  // Endpoint to retrieve registered end users for the super admin.
  superAdminRegisteredUsers: "/get_super_admin_registered_users_list",
  // Endpoint to toggle event host block/unblock status.
  toggleEventHostBlockStatus: "/toggle_event_host_block_status",
  // Endpoint to toggle event hide/unhide status.
  toggleEventHideStatus: "/toggle_event_hide_status",
  // Endpoint to fetch paginated CMS pages list for the super admin.
  cmsPagesList: "/get_cms_pages_list",
  // Endpoint to fetch a detailed single CMS page record for the super admin.
  cmsPageDetails: "/get_cms_page_details",
  // Endpoint to create a new CMS page.
  createCmsPage: "/create_cms_page",
  // Endpoint to update an existing CMS page.
  updateCmsPage: "/update_cms_page",
  // Endpoint to delete a CMS page.
  deleteCmsPage: "/delete_cms_page",
  // Endpoint to fetch event settlement summary for super admin.
  eventSettlementSummary: "/get_event_settlement_summary",
  // Endpoint to settle event payout for super admin.
  settleEventPayout: "/settle_event_payout",
  // Endpoint to fetch event settlement breakdown for super admin.
  getEventSettlementBreakdown: "/get_event_settlement_breakdown",
  // Endpoint to fetch global platform fee configuration.
  getGlobalPlatformFee: "/get_global_platform_fee",
  // Endpoint to fetch paginated list of hosts with custom platform fees.
  getAllHostPlatformFees: "/get_all_host_platform_fees",
  // Endpoint to update global platform fee configuration.
  updateGlobalPlatformFee: "/update_global_platform_fee",
  // Endpoint to update host custom platform fee.
  updateHostPlatformFee: "/update_host_platform_fee",
  // Endpoint to remove host custom platform fee (reset to global).
  removeHostPlatformFee: "/remove_host_platform_fee",
  // Endpoint to fetch platform fee for a specific host.
  getHostPlatformFee: "/get_host_platform_fee",
  // Endpoint to fetch super admin analytics data.
  superAdminAnalytics: "/get_super_admin_analytics",
  // Endpoint to retrieve states list for filter dropdowns.
  getStates: "/get_states",
  // Endpoint to retrieve venue cities and states for events filters.
  getSuperAdminVenueCities: "/get_super_admin_venue_cities",
} as const;

// Derive a union type of valid endpoint keys for type safety.
export type EndpointKey = keyof typeof endpoints;


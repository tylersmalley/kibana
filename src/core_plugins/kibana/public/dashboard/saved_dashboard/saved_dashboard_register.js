export function savedDashboardRegister(savedDashboards) {
  return {
    name: 'dashboards',
    savedObjects: savedDashboards
  };
}

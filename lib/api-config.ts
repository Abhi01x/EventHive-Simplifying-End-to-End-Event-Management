export const API_CONFIG = {
  BASE_URL: "https://d8d2113f7f24.ngrok-free.app/api",
  ENDPOINTS: {
    AUTH: {
      LOGIN: "/auth/login",
      SIGNUP: "/auth/register",
      VERIFY: "/auth/verify-otp",
      LOGOUT: "/auth/logout",
      ME: "/auth/me",
    },
    USER: {
      POPULAR_VENUES: "/user/popular-venue",
      POPULAR_SPORTS: "/user/popular-sports",
      GET_VENUES: "/user/get-venue",
      SEARCH_VENUES: "/user/get-venuesearch",
      MY_BOOKING: "/user/my-booking",
      GET_EVENT: "/user/get-event", // add get-event endpoint for dashboard events
      GET_CATEGORIES: "/user/get-categories",
      GET_EVENT_BY_ID: "/user/get-event/:id",
      GET_EVENTS_BY_CATEGORY: "/user/categories/:categoryId",
      GET_EVENT_BY_SEARCH: "/user/get-event-bysearch",
      GET_TICKETS: "/user/get-tickets",
    },
    OWNER: {
      GET_DETAIL: "/owner/get-detail",
      GET_VENUES_DETAIL: "/owner/get-venues-detail",
      GET_COURTS: "/owner/get-courts",
      DELETE_COURT: "/owner/delete-court",
    },
    VENUES: "/venues",
    BOOKINGS: "/user/my-booking",
    USERS: "/users",
  },
}

// Helper function to build full API URLs
export const buildApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`
}

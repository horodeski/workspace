// Shared API response types for frontend integration
// These interfaces match the frontend's TypeScript interfaces for type-safe communication

export interface ActivityResponse {
  id: string;
  title: string;
  description: string;
  date: string;
  startTime: string | null;
  duration: number | null;
  recurrence: 'none' | 'weekday' | 'daily' | 'weekly' | 'monthly';
  priority: 'low' | 'medium' | 'high' | 'urgent' | null;
  createdAt: string;
  updatedAt: string;
}

export interface ExpandedActivityResponse extends ActivityResponse {
  isRecurrenceInstance: boolean;
  instanceDate: string;
  completedOnDate: boolean;
}

export interface SupportEntryResponse {
  id: string;
  date: string;
  description: string;
  duration: string;
  observation: string;
  createdAt: string;
}

export interface BoardResponse {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface BoardItemResponse {
  id: string;
  content: string;
  type: 'quote' | 'image' | 'link' | 'note';
  position: { x: number; y: number };
  size: { width: number; height: number };
  createdAt: string;
  updatedAt: string;
}

export interface BoardWithItemsResponse extends BoardResponse {
  items: BoardItemResponse[];
}

export interface ReviewResponse {
  id: string;
  weekNumber: number;
  year: number;
  startDate: string;
  endDate: string;
  learning: string;
  decisions: string;
  resolvedProblems: string;
  timeWaste: string;
  nextWeekFocus: string;
  isLocked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WeekHistoryItemResponse {
  weekNumber: number;
  year: number;
  hasReview: boolean;
  isLocked: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
  totalCount: number;
}

export interface TokenPairResponse {
  accessToken: string;
  refreshToken: string;
}

export interface UserProfileResponse {
  id: string;
  email: string;
  createdAt: string;
}

export interface ApiErrorResponse {
  statusCode: number;
  error: string;
  message: string;
  details?: Array<{ path: string; message: string; code: string }>;
}

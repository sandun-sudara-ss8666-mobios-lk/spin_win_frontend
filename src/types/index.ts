export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  data: T;
  meta?: Record<string, any>;
  timestamp: string;
}

export type DayStatus = 'UPCOMING' | 'IN_PROGRESS' | 'COMPLETED';
export type ParticipationStatus = 'WAITING' | 'SELECTED' | 'SPINNING' | 'COMPLETED' | 'SKIPPED' | 'DAY_CLOSED';
export type RewardType = 'PHYSICAL' | 'VOUCHER' | 'MERCHANDISE' | 'NO_WIN' | 'LIMITED' | 'UNLIMITED';
export type InventoryMode = 'LIMITED' | 'UNLIMITED' | 'NO_WIN';
export type DistributionStrategy = 'EXHIBITION_WIDE' | 'AUTO_DAILY' | 'CUSTOM_DAILY';
export type InventoryStrategy = DistributionStrategy;
export type AwardStatus = 'AWARDED' | 'CANCELLED' | 'HANDED_OVER' | 'PENDING_HANDOVER';
export type CancellationResolution = 'IMMEDIATE_RETURN' | 'RETURN_TO_PACING' | 'RETIRE';
export type PriorityListStatus = 'DRAFT' | 'PUBLISHED' | 'INACTIVE';

export interface ExhibitionDay {
  id: string;
  exhibitionId: string;
  dayNumber: number;
  date: string;
  label: string;
  status: DayStatus;
  actualStartedAt: string | null;
  actualEndedAt: string | null;
  actualStartTime?: string | null;
  actualEndTime?: string | null;
  pacingStartTime: string;
  pacingEndTime: string;
}

export interface Exhibition {
  id: string;
  name: string;
  description?: string;
  timezone: string;
  isActive: boolean;
  isPaused: boolean;
  pacingStartTime: string;
  pacingEndTime: string;
  days: ExhibitionDay[];
}

export interface Merchant {
  id: string;
  name: string;
  slug?: string;
  description?: string | null;
  logoUrl?: string | null;
  primaryColor?: string | null;
  brandColor?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  isActive: boolean;
  _count?: {
    rewards: number;
  };
}

export interface DailyAllocation {
  id: string;
  rewardId: string;
  exhibitionDayId: string;
  allocatedQuantity: number;
  carriedForwardQuantity: number;
  awardedQuantity: number;
  isFinalized: boolean;
  exhibitionDay?: {
    dayNumber: number;
    label: string;
    date: string;
    status: DayStatus;
  };
}

export interface StockLedgerEntry {
  id: string;
  rewardId: string;
  exhibitionDayId?: string | null;
  entryType: string;
  quantityDelta: number;
  balanceAfter: number;
  referenceId?: string | null;
  notes?: string | null;
  createdBy?: string | null;
  createdAt: string;
}

export interface Reward {
  id: string;
  merchantId?: string | null;
  name: string;
  description?: string | null;
  type: RewardType;
  shortLabel: string;
  wheelLabel?: string;
  inventoryMode: InventoryMode;
  distributionStrategy: DistributionStrategy;
  inventoryStrategy?: DistributionStrategy;
  totalPhysicalStock: number;
  availablePhysicalStock: number;
  retiredStock: number;
  awardedCount?: number;
  carryForward: boolean;
  carryForwardEnabled?: boolean;
  isActive: boolean;
  effectiveStartAt?: string | null;
  baselineWeight: number;
  baseWeight?: number;
  colorHex?: string | null;
  sliceColor?: string | null;
  textColor?: string | null;
  iconUrl?: string | null;
  videoUrl?: string | null;
  isVideoShow?: boolean;
  merchant?: Merchant | null;
  dailyAllocations?: DailyAllocation[];
  allocations?: DailyAllocation[];
  stockLedger?: StockLedgerEntry[];
  _count?: {
    awards: number;
    spins: number;
  };
}

export interface WheelSliceVisual {
  id?: string;
  sliceIndex: number;
  label: string;
  backgroundColor: string;
  textColor: string;
  color?: string;
  iconUrl?: string | null;
  isNoWin: boolean;
  rewardId?: string | null;
  videoUrl?: string | null;
  isVideoShow?: boolean;
  rewardName?: string;
  rewardType?: RewardType;
  merchantName?: string;
  merchant?: {
    name: string;
    logoUrl?: string | null;
    primaryColor?: string | null;
  } | null;
}

export type WheelSliceDisplay = WheelSliceVisual;

export interface WheelConfigDisplay {
  version?: number;
  name: string;
  sliceCount: number;
  totalSlices?: number;
  slices: WheelSliceVisual[];
}

export interface SliceProbabilityPreview {
  sliceId?: string;
  sliceIndex: number;
  label: string;
  rewardId?: string | null;
  isNoWin: boolean;
  baselineWeight: number;
  rank?: number | null;
  priorityMultiplier?: number;
  finalWeight?: number;
  probabilityPercent: number;
  effectiveProbabilityPercent?: number;
  isEligible?: boolean;
}

export interface ProbabilityPreviewResponse {
  wheelVersion: number;
  activeDayNumber: number | null;
  activePriorityList: {
    id: string;
    name: string;
    version: number;
  } | null;
  serverTime: string;
  slices: SliceProbabilityPreview[];
}

export interface Participation {
  id: string;
  readableRef: string;
  reference?: string;
  visitorName: string;
  visitorPhone: string;
  visitorPhoneMasked?: string;
  status: ParticipationStatus;
  registeredAt: string;
  selectedAt?: string | null;
  completedAt?: string | null;
  spin?: {
    id: string;
    isWin: boolean;
    status: string;
    sliceIndex: number;
    reward?: {
      id: string;
      name: string;
      shortLabel: string;
      type: RewardType;
    } | null;
  } | null;
  repeatStats?: {
    isRepeatVisitor: boolean;
    totalRegistrations: number;
    totalWins: number;
  };
  isRepeatVisitor?: boolean;
  previousParticipationCount?: number;
}

export interface SpinResult {
  spinId: string;
  participationId: string;
  readableRef: string;
  visitorName: string;
  sliceIndex: number;
  sliceLabel: string;
  isWin: boolean;
  reward?: {
    id: string;
    name: string;
    shortLabel: string;
    type: RewardType;
    colorHex?: string | null;
    iconUrl?: string | null;
    videoUrl?: string | null;
    isVideoShow?: boolean;
    merchant?: WheelSliceVisual['merchant'];
  } | null;
  completedAt: string;
  isReplay: boolean;
}

export interface Award {
  id: string;
  spinId: string;
  participationId: string;
  rewardId: string;
  exhibitionDayId: string;
  status: AwardStatus;
  cancellationReason?: string | null;
  cancellationResolution?: CancellationResolution | null;
  cancelledBy?: string | null;
  cancelledAt?: string | null;
  createdAt: string;
  reward: Reward;
  participation: Participation;
  exhibitionDay: ExhibitionDay;
}

export interface DashboardSummary {
  activeDay: {
    id: string;
    dayNumber: number;
    label: string;
    status: DayStatus;
    actualStartedAt: string | null;
    pacingStartTime: string;
    pacingEndTime: string;
    isPaused: boolean;
  } | null;
  kpis: {
    totalRegistrationsAllTime: number;
    totalRegistrationsToday: number;
    waitingQueueCount: number;
    totalSpinsAllTime: number;
    totalSpinsToday: number;
    totalWinsToday: number;
    winRatePercent: number;
    activeRewardsCount: number;
  };
  topPrizesToday: {
    rewardId: string;
    rewardName: string;
    shortLabel: string;
    type: RewardType;
    count: number;
  }[];
  totalRegistrations?: number;
  totalSpins?: number;
  totalWins?: number;
  totalNoWins?: number;
  winRatePercent?: number | string;
  totalRemainingStock?: number;
  activeRewardCount?: number;
  queueWaitingCount?: number;
  queueSelectedCount?: number;
  queueSkippedCount?: number;
  rewardSummaries?: any[];
  recentWins?: any[];
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
}

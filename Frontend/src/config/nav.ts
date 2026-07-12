import type { ComponentType } from "react"
import type { IconProps } from "@phosphor-icons/react"
import {
  BellIcon,
  BellRingingIcon,
  ClockIcon,
  CubeIcon,
  ArrowUUpLeftIcon,
  ArrowsClockwiseIcon,
  GearIcon,
  HouseIcon,
  MapTrifoldIcon,
  MotorcycleIcon,
  PackageIcon,
  QuestionIcon,
  ReceiptIcon,
  SparkleIcon,
  SquaresFourIcon,
  StarIcon,
  TicketIcon,
  TruckIcon,
  UsersIcon,
  ImageIcon,
} from "@phosphor-icons/react"

export interface NavChildItem {
  labelKey: string
  href: string
}

export interface NavItem {
  labelKey: string
  icon: ComponentType<IconProps>
  href?: string
  badge?: string
  items?: NavChildItem[]
}

export interface NavGroup {
  headingKey: string
  items: NavItem[]
}

export const navGroups: NavGroup[] = [
  {
    headingKey: "overview",
    items: [
      { labelKey: "dashboard", href: "/", icon: HouseIcon },
      // { labelKey: "posDashboard", href: "/pos-dashboard", icon: ChartBarIcon },
      { labelKey: "orders", href: "/orders", icon: CubeIcon },
      {
        labelKey: "returnRequests",
        href: "/return-requests",
        icon: ArrowUUpLeftIcon,
      },
      {
        labelKey: "dispatchManagement",
        href: "/dispatch-management",
        icon: TruckIcon,
      },
    ],
  },
  {
    headingKey: "catalog",
    items: [
      { labelKey: "categories", href: "/categories", icon: SquaresFourIcon },
      {
        labelKey: "products",
        icon: PackageIcon,
        items: [
          { labelKey: "products", href: "/products" },
          {
            labelKey: "pendingApprovalProducts",
            href: "/products/pending-approval",
          },
          { labelKey: "badges", href: "/products/badges" },
          { labelKey: "productFaqs", href: "/products/faqs" },
          { labelKey: "productReviews", href: "/products/reviews" },
        ],
      },
      { labelKey: "brands", href: "/brands", icon: SparkleIcon },
      { labelKey: "taxRates", href: "/tax-rates", icon: ReceiptIcon },
    ],
  },
  {
    headingKey: "people",
    items: [
      {
        labelKey: "customers",
        icon: UsersIcon,
        items: [
          { labelKey: "customers", href: "/customers" },
          {
            labelKey: "walletTransactions",
            href: "/customers/wallet-transactions",
          },
          {
            labelKey: "pendingWalletDeposits",
            href: "/customers/pending-wallet-deposits",
          },
          { labelKey: "referAndEarn", href: "/customers/refer-and-earn" },
          {
            labelKey: "referralEarnings",
            href: "/customers/referral-earnings",
          },
        ],
      },
      // {
      //   labelKey: "sellerManagement",
      //   icon: StorefrontIcon,
      //   items: [
      //     { labelKey: "sellers", href: "/sellers" },
      //     {
      //       labelKey: "settlementOverview",
      //       href: "/sellers/settlement-overview",
      //     },
      //     { labelKey: "sellerWithdrawals", href: "/sellers/withdrawals" },
      //     {
      //       labelKey: "sellerWithdrawalHistory",
      //       href: "/sellers/withdrawal-history",
      //     },
      //   ],
      // },
      // {
      //   labelKey: "stores",
      //   icon: BuildingsIcon,
      //   items: [
      //     { labelKey: "stores", href: "/stores" },
      //     { labelKey: "storeReviews", href: "/stores/reviews" },
      //   ],
      // },
      {
        labelKey: "manageDeliveryBoys",
        icon: MotorcycleIcon,
        items: [
          { labelKey: "deliveryBoys", href: "/delivery-boys" },
          { labelKey: "liveTracking", href: "/delivery-boys/live-tracking" },
          {
            labelKey: "deliveryBoyEarnings",
            href: "/delivery-boys/earnings",
          },
          {
            labelKey: "earningHistory",
            href: "/delivery-boys/earning-history",
          },
          {
            labelKey: "deliveryBoyCashCollections",
            href: "/delivery-boys/cash-collections",
          },
          {
            labelKey: "cashCollectionHistory",
            href: "/delivery-boys/cash-collection-history",
          },
          {
            labelKey: "deliveryBoyWithdrawals",
            href: "/delivery-boys/withdrawals",
          },
          {
            labelKey: "deliveryBoyWithdrawalHistory",
            href: "/delivery-boys/withdrawal-history",
          },
          {
            labelKey: "deliveryBoyReferAndEarn",
            href: "/delivery-boys/refer-and-earn",
          },
          {
            labelKey: "deliveryBoyReviews",
            href: "/delivery-boys/reviews",
          },
        ],
      },
    ],
  },
  {
    headingKey: "marketing",
    items: [
      { labelKey: "banners", href: "/banners", icon: ImageIcon },
      {
        labelKey: "manageFeaturedSection",
        href: "/featured-sections",
        icon: StarIcon,
      },
      { labelKey: "promos", href: "/promos", icon: TicketIcon },
      // {
      //   labelKey: "adCampaigns",
      //   icon: MegaphoneIcon,
      //   items: [
      //     { labelKey: "adCampaignsDashboard", href: "/ad-campaigns" },
      //     { labelKey: "adCampaigns", href: "/ad-campaigns/campaigns" },
      //     {
      //       labelKey: "adWalletSellers",
      //       href: "/ad-campaigns/wallet-sellers",
      //     },
      //     {
      //       labelKey: "adPendingWalletDeposits",
      //       href: "/ad-campaigns/pending-wallet-deposits",
      //     },
      //   ],
      // },
    ],
  },
  {
    headingKey: "communication",
    items: [
      {
        labelKey: "appNotifications",
        href: "/app-notifications",
        icon: BellIcon,
      },
      {
        labelKey: "notifications",
        href: "/notifications",
        icon: BellRingingIcon,
      },
      { labelKey: "faqs", href: "/faqs", icon: QuestionIcon },
      {
        labelKey: "deliveryZones",
        icon: MapTrifoldIcon,
        items: [
          { labelKey: "deliveryZones", href: "/delivery-zones" },
          { labelKey: "zonePreview", href: "/delivery-zones/preview" },
        ],
      },
    ],
  },
  {
    headingKey: "system",
    items: [
      // {
      //   labelKey: "rolesAndPermissions",
      //   icon: ShieldCheckIcon,
      //   items: [
      //     { labelKey: "roles", href: "/roles" },
      //     { labelKey: "systemUsers", href: "/system-users" },
      //   ],
      // },
      {
        labelKey: "settings",
        icon: GearIcon,
        items: [
          { labelKey: "systemSettings", href: "/settings/system" },
          { labelKey: "webSettings", href: "/settings/web" },
          { labelKey: "appSettings", href: "/settings/app" },
          {
            labelKey: "homeGeneralSettings",
            href: "/settings/home-general",
          },
          {
            labelKey: "authenticationSettings",
            href: "/settings/authentication",
          },
          { labelKey: "emailSettings", href: "/settings/email" },
          { labelKey: "paymentSettings", href: "/settings/payment" },
          {
            labelKey: "notificationSettings",
            href: "/settings/notification",
          },
          {
            labelKey: "deliveryBoySettings",
            href: "/settings/delivery-boy",
          },
          // { labelKey: "sellerSettings", href: "/settings/seller" },
          // {
          //   labelKey: "advertisementSettings",
          //   href: "/settings/advertisement",
          // },
          // { labelKey: "posSettings", href: "/settings/pos" },
        ],
      },
      { labelKey: "cronMonitor", href: "/cron-monitor", icon: ClockIcon },
      {
        labelKey: "systemUpdates",
        href: "/system-updates",
        icon: ArrowsClockwiseIcon,
      },
    ],
  },
]

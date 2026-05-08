
export type UserRole = 'Pre-Admission' | 'In-Campus' | 'Graduate/Alumni' | 'School/Institution';

export type UniversityCategory = 'All' | 'Federal' | 'State' | 'Private' | 'JAMB' | 'Polytechnic' | 'COE' | 'National' | 'Jobs' | 'Scholarships' | 'NYSC';

export type OLevelGrade = 'A1' | 'B2' | 'B3' | 'C4' | 'C5' | 'C6' | 'D7' | 'E8' | 'F9';

export interface NewsItem {
  id: string;
  slug?: string;
  title: string;
  category: UniversityCategory;
  date: string;
  image: string;
  excerpt: string;
  fullContent?: string; 
  relatedNews?: { title: string, url: string }[];
  sourceUrl?: string;
  isLive?: boolean;
  hasVideo?: boolean;
  videoUrl?: string;
  videoScript?: string;
  tags?: string[];
}

export interface NewsVideo {
  id: string;
  newsId: string;
  title: string;
  videoUrl: string;
  thumbnailUrl: string;
  views: number;
  likes: number;
  engagement: number;
  postedTo: ('TikTok' | 'YouTube')[];
  createdAt: any;
}

export interface Comment {
  id: string;
  newsId: string;
  uid: string;
  displayName: string;
  photoURL?: string;
  text: string;
  createdAt: any;
}

export interface BillboardAd {
  id: string;
  title: string;
  description: string;
  category: 'Hostels' | 'Gadgets' | 'Services' | 'Tutorials';
  price?: string;
  imageUrl?: string;
  link: string;
  whatsapp?: string; 
  isVerified: boolean;
  isSponsored?: boolean;
  status: 'pending' | 'active';
  submittedBy?: string;
  paidAmount?: string;
  createdAt?: any;
}

export interface AdPackage {
  id: string;
  name: string;
  price: string;
  amountKobo: number;
  duration: string;
  features: string[];
  color: string;
}

export interface SocialLink {
  platform: 'Facebook' | 'Instagram' | 'Linkedin' | 'Twitter' | 'Youtube' | 'TikTok';
  url: string;
}

export interface AdminState {
  isLoggedIn: boolean;
  email: string | null;
  whatsapp?: string;
}

export interface BroadcastEmail {
  id: string;
  subject: string;
  headline: string;
  body: string;
  ctaText: string;
  ctaLink: string;
  urgency: 'normal' | 'high' | 'critical';
  targetRole?: UserRole | 'All';
  sentAt: any;
  recipientCount: number;
}

export interface Settings {
  firebaseConfig: string;
  notificationsEnabled: boolean;
  theme: 'light' | 'dark';
  googleAdsEnabled: boolean;
  geminiKeys: string[];
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
  maps?: {
    uri: string;
    title: string;
  };
  [key: string]: any;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  image?: string; 
  groundingChunks?: GroundingChunk[];
  photoURL?: string; 
}

export interface AdmissionTimeline {
  university: string;
  stages: {
    stage: string;
    status: string;
    details?: string;
    likelyDate?: string;
    confidence?: string;
  }[];
  lastUpdated: string;
  predictionNote?: string;
}

export interface JobOpening {
  id: string;
  title: string;
  company: string;
  location: string;
  deadline: string;
  description: string;
  applyUrl: string;
}

export interface Scholarship {
  id: string;
  title: string;
  provider: string;
  amount: string;
  deadline: string;
  description: string;
  applyUrl: string;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  age?: string;
  gender?: string;
  last_active: string;
  daily_requests?: number;
  is_premium?: boolean;
  university?: string;
  targetCourse?: string;
}

export interface PostUtmeInfo {
  status: 'Released' | 'Estimated' | 'Unknown';
  date: string;
  previousYearDate?: string;
  registrationLink?: string;
  requirements?: string;
}


import { NewsItem } from './types';

export const ADMISSION_DATES = {
  // Synchronized with the official Myschool/JAMB announcement Feb 2026
  JAMB_REG_START: '2026-01-26T08:00:00',
  JAMB_EPIN_END: '2026-02-26T23:59:59',
  JAMB_REG_END: '2026-02-28T23:59:59', // Final official closing deadline
  UNILAG_POST_UTME: '2026-02-15T00:00:00',
  UI_POST_UTME: '2026-03-01T00:00:00'
};

export const MOCK_NEWS: NewsItem[] = [
  {
    id: '5',
    slug: 'jamb-rules-out-2026-utme-registration-extension-1-million-registered',
    title: 'JAMB Rules Out 2026 UTME Registration Extension; 1 Million Registered',
    category: 'JAMB',
    date: 'Feb 12, 2026',
    image: '',
    excerpt: 'The Joint Admissions and Matriculation Board (JAMB) has announced that there will be NO extension for the 2026 registration period. ePIN sales end Feb 26th, while final registration closes Feb 28th.',
    fullContent: 'JAMB has officially confirmed that approximately one million candidates have already registered for the ongoing 2026 UTME. The Board has made it clear that the registration timeline remains unchanged to align with the calendars of other examination bodies. \n\nKey Dates to Note:\n- Monday, Jan 26: Registration Commenced\n- Thursday, Feb 26: Sales of ePIN Conclude\n- Saturday, Feb 28: Final Registration Deadline\n\nThe Board expressed concern over the "near absence" of candidates at many accredited CBT centres at this stage and warns that late-minute agitations for extensions will not be entertained. Candidates are also warned to beware of registration cheats and fraudulent tutorial centres posing as CBT agents.',
    sourceUrl: 'https://myschool.ng'
  },
  {
    id: '3',
    slug: 'jamb-announces-official-registration-dates-for-2026-utmede',
    title: 'JAMB Announces Official Registration Dates for 2026 UTME/DE',
    category: 'JAMB',
    date: 'Jan 25, 2026',
    image: '',
    excerpt: 'The Joint Admissions and Matriculation Board (JAMB) has scheduled the 2026 Unified Tertiary Matriculation Examination (UTME) registration to commence on January 31, 2026. Candidates are required to generate their profile codes using their NIN.',
    sourceUrl: 'https://www.jamb.gov.ng'
  },
  {
    id: '1',
    slug: 'unilag-announces-20262027-post-utme-registration-schedule',
    title: 'UNILAG Announces 2026/2027 Post-UTME Registration Schedule',
    category: 'Federal',
    date: 'Jan 02, 2026',
    image: '',
    excerpt: 'The University of Lagos (UNILAG) has released the early schedule for the 2026 screening exercise. Candidates are advised to prepare their O-Level results.',
    sourceUrl: 'https://unilag.edu.ng/?cat=4'
  },
  {
    id: '2',
    slug: 'lasu-tops-state-university-rankings-for-2026-academic-session',
    title: 'LASU Tops State University Rankings for 2026 Academic Session',
    category: 'State',
    date: 'Jan 01, 2026',
    image: '',
    excerpt: 'Lagos State University (LASU) continues its dominance in research and student welfare, securing the #1 spot in the latest January rankings.',
    sourceUrl: 'https://lasu.edu.ng/home/news/'
  },
  {
    id: '6',
    slug: 'shell-nigeria-university-scholarship-scheme-2026-applications-open',
    title: 'Shell Nigeria University Scholarship Scheme 2026: Applications Open',
    category: 'Scholarships',
    date: 'Feb 15, 2026',
    image: '',
    excerpt: 'Shell Nigeria (SPDC) invites applications from full-time second-year undergraduates in Nigerian Universities for its 2026 University Scholarship Scheme.',
    sourceUrl: 'https://www.shell.com.ng'
  },
  {
    id: '7',
    slug: 'federal-civil-service-commission-fcsc-recruitment-2026-apply-now',
    title: 'Federal Civil Service Commission (FCSC) Recruitment 2026: Apply Now',
    category: 'Jobs',
    date: 'Feb 18, 2026',
    image: '',
    excerpt: 'The Federal Civil Service Commission is inviting applications from qualified Nigerians for various positions in several Ministries, Departments, and Agencies.',
    sourceUrl: 'https://fedcivilservice.gov.ng'
  },
  {
    id: '8',
    slug: 'nysc-2026-batch-a-mobilization-senate-list-verification-begins',
    title: 'NYSC 2026 Batch A Mobilization: Senate List Verification Begins',
    category: 'NYSC',
    date: 'Feb 20, 2026',
    image: '',
    excerpt: 'The National Youth Service Corps (NYSC) has directed all prospective corps members for 2026 Batch A to verify their names on the Senate list.',
    sourceUrl: 'https://www.nysc.gov.ng'
  },
  {
    id: '9',
    slug: 'nuc-approves-12-new-private-universities-for-2026-academic-session',
    title: 'NUC Approves 12 New Private Universities for 2026 Academic Session',
    category: 'Private',
    date: 'Feb 22, 2026',
    image: '',
    excerpt: 'The National Universities Commission (NUC) has granted operational licenses to 12 new private institutions to expand access to higher education.',
    sourceUrl: 'https://nuc.edu.ng'
  },
  {
    id: '10',
    slug: 'asuu-issues-14-day-ultimatum-over-unresolved-2026-funding-agreements',
    title: 'ASUU Issues 14-Day Ultimatum Over Unresolved 2026 Funding Agreements',
    category: 'National',
    date: 'Feb 24, 2026',
    image: '',
    excerpt: 'The Academic Staff Union of Universities (ASUU) has warned of a potential strike if the Federal Government fails to implement the 2026 funding roadmap.',
    sourceUrl: 'https://asuu.org.ng'
  },
  {
    id: '11',
    slug: 'jamb-to-deploy-biometric-verification-for-2026-mock-utme',
    title: 'JAMB to Deploy Biometric Verification for 2026 Mock UTME',
    category: 'JAMB',
    date: 'Feb 25, 2026',
    image: '',
    excerpt: 'In a bid to curb examination malpractice, JAMB will implement advanced biometric verification for the upcoming 2026 Mock UTME scheduled for March.',
    sourceUrl: 'https://jamb.gov.ng'
  },
  {
    id: '12',
    slug: 'graduate-trainee-program-2026-top-nigerian-banks-recruiting',
    title: 'Graduate Trainee Program 2026: Top Nigerian Banks Recruiting',
    category: 'Jobs',
    date: 'Feb 26, 2026',
    image: '',
    excerpt: 'Several tier-1 Nigerian banks have opened their 2026 graduate trainee portals. Applicants must have a minimum of 2:1 and be under 26 years old.',
    sourceUrl: 'https://proshare.co'
  },
  {
    id: '13',
    slug: 'nysc-2026-batch-a-official-orientation-camp-dates-announced',
    title: 'NYSC 2026 Batch A: Official Orientation Camp Dates Announced',
    category: 'NYSC',
    date: 'Feb 27, 2026',
    image: '',
    excerpt: 'The NYSC management has released the official timetable for the 2026 Batch A orientation course. Registration begins next week.',
    sourceUrl: 'https://nysc.gov.ng'
  },
  {
    id: '14',
    slug: 'nuc-releases-16-new-guidelines-for-issuance-of-honorary-doctorates',
    title: 'NUC Releases 16 New Guidelines for Issuance of Honorary Doctorates',
    category: 'National',
    date: 'Feb 28, 2026',
    image: '',
    excerpt: 'The National Universities Commission (NUC) has introduced 16 stringent guidelines for the award of honorary degrees in Nigerian universities to maintain academic integrity.',
    fullContent: 'The National Universities Commission (NUC) has released a new set of 16 guidelines to regulate the award of honorary doctorate degrees in the Nigerian University System (NUS). \n\nThis move aims to curb the perceived "commercialization" of honorary degrees and ensure that such honors are reserved for individuals who have made truly exceptional contributions to society. \n\nKey Guidelines Include:\n- Mandatory 7-year gap between awards for the same individual.\n- Prohibition of awarding honorary degrees to individuals currently holding political office.\n- Strict criteria for the selection process involving the University Senate and Council.\n- Limitation on the number of honorary degrees a university can award per convocation.\n\nThe NUC warned that universities found violating these guidelines would face sanctions, including the withdrawal of accreditation for certain programs.',
    sourceUrl: 'https://nuc.edu.ng'
  }
];

export const TICKER_HEADLINES = [
  "JAMB 2026: No extension for registration period. Final deadline is February 28th...",
  "ePIN sales conclude on Feb 26th - Generate your profile code now...",
  "UNILAG 2026/2027 admission portal now active for updates...",
  "Over 1 Million candidates successfully profiled for 2026 UTME...",
  "Beware of fraudulent CBT agents - Only use accredited registration centres..."
];

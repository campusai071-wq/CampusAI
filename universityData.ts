
export interface UniversityData {
  name: string;
  founded: string;
  motto: string;
  bestKnownFor: string;
  campusVibe: string;
  facultyStudentRatio: string;
  researchOutput: string;
  facilities: string[];
  scoringSystem: {
    hasJamb: boolean;
    hasPostUtme: boolean;
    hasOLevel: boolean;
    explanation: string;
  };
  courses: string[];
}

export const UNIVERSITIES_DB: Record<string, UniversityData> = {
  "University of Lagos": {
    name: "University of Lagos",
    founded: "1962",
    motto: "In Deed and in Truth",
    bestKnownFor: "Engineering, Law, and Business. Known as the 'University of First Choice'.",
    campusVibe: "Cosmopolitan, vibrant, and highly competitive. Located in the heart of Lagos.",
    facultyStudentRatio: "1:35",
    researchOutput: "High - Leading in medical and environmental research in Nigeria.",
    facilities: ["Main Library", "Unilag Radio", "Medical Center", "Sport Center"],
    scoringSystem: {
      hasJamb: true,
      hasPostUtme: true,
      hasOLevel: true,
      explanation: "UNILAG uses a 50:30:20 ratio. 50% from JAMB, 30% from Post-UTME, and 20% from O-Level results (5 subjects)."
    },
    courses: [
      "Accounting", "Actuarial Science", "Architecture", "Business Administration", 
      "Civil Engineering", "Computer Science", "Economics", "Law", "Medicine and Surgery",
      "Mechanical Engineering", "Pharmacy", "Psychology", "Systems Engineering"
    ]
  },
  "University of Ibadan": {
    name: "University of Ibadan",
    founded: "1948",
    motto: "Recte Sapere Fons (To think straight is the fount of knowledge)",
    bestKnownFor: "Medicine, Arts, and Post-graduate studies. Nigeria's premier university.",
    campusVibe: "Academic, serene, and traditional. Strong emphasis on research and excellence.",
    facultyStudentRatio: "1:25",
    researchOutput: "Very High - The leading research institution in West Africa.",
    facilities: ["Kenneth Dike Library", "UI Zoo", "Botanical Garden", "University Health Service"],
    scoringSystem: {
      hasJamb: true,
      hasPostUtme: true,
      hasOLevel: false,
      explanation: "UI typically uses a 50:50 ratio between JAMB and Post-UTME. O-Level is used for basic eligibility (5 credits)."
    },
    courses: [
      "Adult Education", "Agriculture", "Anthropology", "Archaeology", "Biochemistry",
      "Communication and Language Arts", "History", "Medicine and Surgery", "Nursing Science",
      "Political Science", "Sociology", "Theatre Arts", "Veterinary Medicine"
    ]
  },
  "Obafemi Awolowo University": {
    name: "Obafemi Awolowo University",
    founded: "1961",
    motto: "For Learning and Culture",
    bestKnownFor: "Architecture, ICT, and Agriculture. Known for its beautiful campus architecture.",
    campusVibe: "Intellectually stimulating, politically active, and culturally rich.",
    facultyStudentRatio: "1:30",
    researchOutput: "High - Strong focus on technology and indigenous knowledge.",
    facilities: ["Hezekiah Oluwasanmi Library", "OAU ICT Center", "Natural History Museum"],
    scoringSystem: {
      hasJamb: true,
      hasPostUtme: true,
      hasOLevel: false,
      explanation: "OAU uses a 50:50 ratio. JAMB score is divided by 8, and Post-UTME is over 50."
    },
    courses: [
      "Architecture", "Chemical Engineering", "Computer Science and Engineering", "Demography and Social Statistics",
      "International Relations", "Law", "Medicine and Surgery", "Music", "Philosophy", "Quantity Surveying"
    ]
  },
  "Ahmadu Bello University": {
    name: "Ahmadu Bello University",
    founded: "1962",
    motto: "The Strategic Hub of the North",
    bestKnownFor: "Architecture, Engineering, and Medicine. Largest university in Sub-Saharan Africa.",
    campusVibe: "Diverse, expansive, and academic. Strong pan-African identity.",
    facultyStudentRatio: "1:40",
    researchOutput: "High - Leading in agricultural and nuclear research.",
    facilities: ["Kashim Ibrahim Library", "ABU Teaching Hospital", "Nuclear Research Center"],
    scoringSystem: {
      hasJamb: true,
      hasPostUtme: true,
      hasOLevel: false,
      explanation: "ABU uses a 50:50 ratio between JAMB and Post-UTME screening."
    },
    courses: [
      "Accounting", "Agriculture", "Architecture", "Civil Engineering", "Fine Arts",
      "Geography", "History", "Medicine and Surgery", "Pharmacy", "Quantity Surveying", "Urban and Regional Planning"
    ]
  },
  "University of Nigeria, Nsukka": {
    name: "University of Nigeria, Nsukka",
    founded: "1960",
    motto: "To Restore the Dignity of Man",
    bestKnownFor: "Journalism, Pharmacy, and Engineering. First indigenous university in Nigeria.",
    campusVibe: "Resilient, traditional, and community-oriented. Strong 'Lions and Lionesses' spirit.",
    facultyStudentRatio: "1:35",
    researchOutput: "High - Strong focus on humanities and professional studies.",
    facilities: ["Nnamdi Azikiwe Library", "UNN Medical Center", "Roar Nigeria Hub"],
    scoringSystem: {
      hasJamb: true,
      hasPostUtme: true,
      hasOLevel: false,
      explanation: "UNN uses a 60:40 ratio (JAMB:Post-UTME) or 50:50 depending on the year's policy."
    },
    courses: [
      "Accountancy", "Banking and Finance", "Civil Engineering", "Electronic Engineering",
      "Estate Management", "Law", "Mass Communication", "Medicine and Surgery", "Pharmacy", "Public Administration"
    ]
  }
};

export const getUniversityFromDB = (name: string): UniversityData | null => {
  // Try exact match
  if (UNIVERSITIES_DB[name]) return UNIVERSITIES_DB[name];
  
  // Try fuzzy match (case insensitive and partial)
  const searchName = name.toLowerCase();
  const foundKey = Object.keys(UNIVERSITIES_DB).find(key => 
    key.toLowerCase().includes(searchName) || searchName.includes(key.toLowerCase())
  );
  
  return foundKey ? UNIVERSITIES_DB[foundKey] : null;
};

import axios from 'axios';

export const checkFUTAAdmissionStatus = async (jambRegNumber: string): Promise<string> => {
  // This is a placeholder as I don't have the actual FUTA API endpoint.
  // In a real scenario, this would call the FUTA portal API.
  try {
    // const response = await axios.get(`https://futa.edu.ng/api/admission/${jambRegNumber}`);
    // return response.data.status;
    return "Status check for " + jambRegNumber + " is currently unavailable via API.";
  } catch (e) {
    return "Error checking admission status.";
  }
};

const API_BASE_URL = "http://localhost:8000/api";

export const signup = async (userData) => {
  const response = await fetch(`${API_BASE_URL}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData),
  });
  return response.json();
};

export const login = async (credentials) => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });
  return response.json();
};

export const fetchAuctions = async () => {
  const response = await fetch(`${API_BASE_URL}/auctions`);
  return response.json();
};

export const createAuction = async (auctionData) => {
  const response = await fetch(`${API_BASE_URL}/auctions/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(auctionData),
  });
  return response.json();
};

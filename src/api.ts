/**
 * API
 */

import axios from "axios";

// const API_URI = "https://dddice.com/api/1.0";
const API_URI = "http://localhost:8000/api/1.0";

export interface IRoom {
  slug: string;
  name: string;
}

export interface IStorage {
  apiKey?: string;
  room?: string;
  theme?: string;
}

export interface ITheme {
  id: string;
  name: string;
}

export interface IUser {
  uuid: string;
  username: string;
}

class API {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;

    axios.defaults.headers.common["Authorization"] = `Bearer ${this.apiKey}`;
    axios.defaults.headers.common["Content-Type"] = `application/json`;
  }

  public user = () => ({
    get: async () => (await axios.get(`${API_URI}/user`)).data.data,
  });

  public roll = () => ({
    create: async (dice: { type: string; theme: string }[], room: string) =>
      (await axios.post(`${API_URI}/roll`, { dice, room })).data.data,
  });

  public room = () => ({
    list: async () => (await axios.get(`${API_URI}/room`)).data.data,
  });

  public diceBox = () => ({
    list: async () => (await axios.get(`${API_URI}/dice-box`)).data.data,
  });
}

export default API;

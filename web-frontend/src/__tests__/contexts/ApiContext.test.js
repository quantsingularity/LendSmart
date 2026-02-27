import React from "react";
import { renderHook, act, waitFor } from "@testing-library/react";
import { ApiProvider, useApi } from "../../contexts/ApiContext";
import axios from "axios";

jest.mock("axios");

describe("ApiContext", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  test("should initialize with default values", () => {
    const wrapper = ({ children }) => <ApiProvider>{children}</ApiProvider>;
    const { result } = renderHook(() => useApi(), { wrapper });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBe(null);
    expect(result.current.loading).toBe(false);
  });

  test("should handle login successfully", async () => {
    const mockUser = { id: "1", email: "test@test.com", name: "Test User" };
    const mockToken = "mock-token";

    axios.post.mockResolvedValueOnce({
      data: {
        user: mockUser,
        token: mockToken,
      },
    });

    const wrapper = ({ children }) => <ApiProvider>{children}</ApiProvider>;
    const { result } = renderHook(() => useApi(), { wrapper });

    await act(async () => {
      await result.current.login("test@test.com", "password");
    });

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
    });
  });

  test("should handle register successfully", async () => {
    const mockUser = { id: "1", email: "test@test.com", name: "Test User" };
    const mockToken = "mock-token";

    axios.post.mockResolvedValueOnce({
      data: {
        user: mockUser,
        token: mockToken,
      },
    });

    const wrapper = ({ children }) => <ApiProvider>{children}</ApiProvider>;
    const { result } = renderHook(() => useApi(), { wrapper });

    await act(async () => {
      await result.current.register({
        name: "Test User",
        email: "test@test.com",
        password: "password",
      });
    });

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
    });
  });

  test("should handle logout", async () => {
    axios.get.mockResolvedValueOnce({});

    const wrapper = ({ children }) => <ApiProvider>{children}</ApiProvider>;
    const { result } = renderHook(() => useApi(), { wrapper });

    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBe(null);
    expect(localStorage.getItem("token")).toBe(null);
  });
});

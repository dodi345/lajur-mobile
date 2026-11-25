import { ApiError, OFFLINE_MESSAGE, request, setApiToken, setUnauthorizedHandler, toApiError } from "@/lib/api";

const fetchMock = jest.fn();
globalThis.fetch = fetchMock as unknown as typeof fetch;

const json = (status: number, body: unknown) =>
  Promise.resolve(new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } }));

afterEach(() => {
  fetchMock.mockReset();
  setApiToken(null);
  setUnauthorizedHandler(null);
});

describe("klien API", () => {
  it("token dikirim sebagai Bearer; body JSON", async () => {
    setApiToken("token-uji");
    fetchMock.mockReturnValueOnce(json(201, { id: 7 }));
    await expect(request("/api/v1/transactions", { method: "POST", body: { amount: 1000 } })).resolves.toEqual({ id: 7 });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://lajur.stackfolio.web.id/api/v1/transactions");
    expect(init.headers.authorization).toBe("Bearer token-uji");
    expect(init.headers["content-type"]).toBe("application/json");
    expect(init.body).toBe('{"amount":1000}');
  });

  it("422 API v1 → pesan + error per field", async () => {
    fetchMock.mockReturnValueOnce(json(422, { error: { message: "Periksa isian yang ditandai.", fieldErrors: { amount: "Nominal wajib diisi." } } }));
    const error = await request("/api/v1/transactions", { method: "POST", body: {} }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 422, message: "Periksa isian yang ditandai.", fieldErrors: { amount: "Nominal wajib diisi." } });
  });

  it("401 di /api/v1 dengan token → sesi diakhiri (handler dipanggil); tanpa token tidak", async () => {
    const handler = jest.fn();
    setUnauthorizedHandler(handler);
    fetchMock.mockReturnValueOnce(json(401, { error: { message: "Masuk dulu." } }));
    await expect(request("/api/v1/home")).rejects.toMatchObject({ status: 401 });
    expect(handler).not.toHaveBeenCalled();

    setApiToken("token-kedaluwarsa");
    fetchMock.mockReturnValueOnce(json(401, { error: { message: "Masuk dulu." } }));
    await expect(request("/api/v1/home")).rejects.toMatchObject({ status: 401 });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("gangguan jaringan → pesan offline yang jelas", async () => {
    fetchMock.mockRejectedValueOnce(new TypeError("Network request failed"));
    await expect(request("/api/v1/home")).rejects.toMatchObject({ status: 0, message: OFFLINE_MESSAGE });
  });

  it("error Better Auth { code, message } → kode tersimpan", () => {
    expect(toApiError(401, { code: "INVALID_EMAIL_OR_PASSWORD", message: "Invalid email or password" })).toMatchObject({
      status: 401,
      code: "INVALID_EMAIL_OR_PASSWORD",
    });
    expect(toApiError(500, null).message).toMatch(/Terjadi kesalahan \(500\)/);
  });
});

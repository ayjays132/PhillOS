package main

import (
    "encoding/json"
    "net/http"
    "net/http/httptest"
    "os"
    "path/filepath"
    "strings"
    "testing"
)

// Test handleCompare ensures default models are used and runModel is invoked
func TestHandleCompare(t *testing.T) {
    dir := t.TempDir()
    script := filepath.Join(dir, "ollama")
    if err := os.WriteFile(script, []byte("#!/bin/sh\necho mocked"), 0755); err != nil {
        t.Fatal(err)
    }
    oldPath := os.Getenv("PATH")
    os.Setenv("PATH", dir+string(os.PathListSeparator)+oldPath)
    defer os.Setenv("PATH", oldPath)

    req := httptest.NewRequest(http.MethodPost, "/api/genlab/compare", strings.NewReader(`{"prompt":"hi"}`))
    w := httptest.NewRecorder()
    handleCompare(w, req)

    if w.Code != http.StatusOK {
        t.Fatalf("status %d", w.Code)
    }
    var resp compareResponse
    if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
        t.Fatal(err)
    }
    if resp.A == "" || resp.B == "" {
        t.Fatalf("expected response, got %+v", resp)
    }
}

// Test offline scenario when ollama is missing
func TestHandleCompareOffline(t *testing.T) {
    oldPath := os.Getenv("PATH")
    os.Setenv("PATH", "")
    defer os.Setenv("PATH", oldPath)

    req := httptest.NewRequest(http.MethodPost, "/api/genlab/compare", strings.NewReader(`{"prompt":"hi"}`))
    w := httptest.NewRecorder()
    handleCompare(w, req)

    if w.Code != http.StatusOK {
        t.Fatalf("status %d", w.Code)
    }
    var resp compareResponse
    if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
        t.Fatal(err)
    }
    if resp.A != "" || resp.B != "" {
        t.Fatalf("expected empty strings when ollama missing, got %+v", resp)
    }
}

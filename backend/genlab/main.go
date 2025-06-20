package main

import (
    "bytes"
    "encoding/json"
    "log"
    "net/http"
    "os/exec"
)

type compareRequest struct {
    Prompt string `json:"prompt"`
    ModelA string `json:"modelA"`
    ModelB string `json:"modelB"`
}

type compareResponse struct {
    A string `json:"a"`
    B string `json:"b"`
}

func runModel(model, prompt string) (string, error) {
    cmd := exec.Command("ollama", "run", model, prompt)
    var out bytes.Buffer
    cmd.Stdout = &out
    cmd.Stderr = &out
    err := cmd.Run()
    return out.String(), err
}

func handleCompare(w http.ResponseWriter, r *http.Request) {
    var req compareRequest
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        http.Error(w, "bad request", http.StatusBadRequest)
        return
    }
    if req.ModelA == "" {
        req.ModelA = "qwen3:1.7b"
    }
    if req.ModelB == "" {
        req.ModelB = "llama2"
    }
    a, _ := runModel(req.ModelA, req.Prompt)
    b, _ := runModel(req.ModelB, req.Prompt)
    resp := compareResponse{A: a, B: b}
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(resp)
}

func main() {
    mux := http.NewServeMux()
    mux.HandleFunc("/api/genlab/compare", handleCompare)
    log.Fatal(http.ListenAndServe(":3456", mux))
}


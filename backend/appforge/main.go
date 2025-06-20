package main

import (
    "encoding/json"
    "log"
    "net/http"
    "os"
    "path/filepath"
    "sync"

    "github.com/google/go-containerregistry/pkg/crane"
    "github.com/google/go-containerregistry/pkg/name"
)

var (
    storageDir string
    statsFile  string
    statsMu    sync.Mutex
    stats      map[string]int
)

func init() {
    dir := os.Getenv("APPFORGE_STORAGE_DIR")
    if dir == "" {
        dir = filepath.Join("storage", "appforge")
    }
    storageDir = dir
    statsFile = filepath.Join(storageDir, "usage.json")
    loadStats()
}

func loadStats() {
    stats = map[string]int{}
    if data, err := os.ReadFile(statsFile); err == nil {
        _ = json.Unmarshal(data, &stats)
    }
}

func saveStats() {
    os.MkdirAll(storageDir, 0755)
    data, _ := json.MarshalIndent(stats, "", "  ")
    _ = os.WriteFile(statsFile, data, 0644)
}

func record(img string) {
    statsMu.Lock()
    defer statsMu.Unlock()
    stats[img]++
    saveStats()
}

func listRepos(w http.ResponseWriter, r *http.Request) {
    repo := r.URL.Query().Get("repo")
    if repo == "" {
        http.Error(w, "repo required", 400)
        return
    }
    tags, err := crane.ListTags(repo)
    if err != nil {
        http.Error(w, err.Error(), 500)
        return
    }
    json.NewEncoder(w).Encode(map[string]any{"tags": tags})
}

func install(w http.ResponseWriter, r *http.Request) {
    var req struct{ Image string `json:"image"` }
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Image == "" {
        http.Error(w, "image required", 400)
        return
    }
    img, err := crane.Pull(req.Image)
    if err != nil {
        http.Error(w, err.Error(), 500)
        return
    }
    ref, _ := name.ParseReference(req.Image)
    path := filepath.Join(storageDir, ref.Context().RepositoryStr(), ref.Identifier())
    os.MkdirAll(path, 0755)
    if err := crane.SaveOCI(img, path); err != nil {
        http.Error(w, err.Error(), 500)
        return
    }
    record(req.Image)
    json.NewEncoder(w).Encode(map[string]any{"success": true})
}

func uninstall(w http.ResponseWriter, r *http.Request) {
    var req struct{ Image string `json:"image"` }
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Image == "" {
        http.Error(w, "image required", 400)
        return
    }
    ref, _ := name.ParseReference(req.Image)
    path := filepath.Join(storageDir, ref.Context().RepositoryStr(), ref.Identifier())
    os.RemoveAll(path)
    record(req.Image)
    json.NewEncoder(w).Encode(map[string]any{"success": true})
}

func usage(w http.ResponseWriter, r *http.Request) {
    statsMu.Lock()
    defer statsMu.Unlock()
    json.NewEncoder(w).Encode(stats)
}

func main() {
    mux := http.NewServeMux()
    mux.HandleFunc("/repos", listRepos)
    mux.HandleFunc("/install", install)
    mux.HandleFunc("/uninstall", uninstall)
    mux.HandleFunc("/usage", usage)
    port := os.Getenv("PORT")
    if port == "" {
        port = "3201"
    }
    log.Printf("Appforge server listening on port %s", port)
    log.Fatal(http.ListenAndServe(":"+port, mux))
}


package main

import (
	"encoding/json"
	"io"
	"log"
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
)

// paths relative to repo root
var (
	rootDir        string
	settingsFile   string
	storageDir     string
	themeFile      string
	launcherScript string
)

func init() {
	_, file, _, _ := runtime.Caller(0)
	base := filepath.Dir(file)             // src/backend
	rootDir = filepath.Join(base, "../..") // repo root
	settingsFile = filepath.Join(rootDir, "backend", "protonSettings.json")
	if d := os.Getenv("PHILLOS_STORAGE_DIR"); d != "" {
		storageDir = d
	} else {
		storageDir = filepath.Join(rootDir, "storage")
	}
	themeFile = filepath.Join(storageDir, "theme.cfg")
	launcherScript = filepath.Join(rootDir, "backend", "protonLauncher.js")
}

// Settings holds per-executable proton config
type Settings map[string]struct {
	Version    string `json:"version"`
	Prefix     string `json:"prefix"`
	WineBinary string `json:"wineBinary"`
}

func loadSettings() Settings {
	data, err := os.ReadFile(settingsFile)
	if err != nil {
		return Settings{}
	}
	var m Settings
	if err := json.Unmarshal(data, &m); err != nil {
		return Settings{}
	}
	return m
}

func saveSettings(m Settings) {
	data, err := json.MarshalIndent(m, "", "  ")
	if err != nil {
		return
	}
	_ = os.WriteFile(settingsFile, data, 0644)
}

func loadTheme() string {
	b, err := os.ReadFile(themeFile)
	if err != nil {
		return "dark"
	}
	return strings.TrimSpace(string(b))
}

func saveTheme(theme string) {
	if err := os.MkdirAll(storageDir, 0755); err != nil {
		return
	}
	_ = os.WriteFile(themeFile, []byte(theme), 0644)
}

// --- HTTP Handlers ---

func phoneBridgeHandler(target *url.URL) http.Handler {
	proxy := httputil.NewSingleHostReverseProxy(target)
	proxy.Director = func(r *http.Request) {
		r.URL.Scheme = target.Scheme
		r.URL.Host = target.Host
		r.Host = target.Host
		r.URL.Path = strings.TrimPrefix(r.URL.Path, "/phonebridge")
	}
	return proxy
}

func handleLaunchProton(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Path    string `json:"path"`
		Version string `json:"version"`
		Prefix  string `json:"prefix"`
		Wine    string `json:"wine"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "bad request", http.StatusBadRequest)
		return
	}
	if req.Path == "" {
		http.Error(w, `{"error":"path required"}`, http.StatusBadRequest)
		return
	}
	settings := loadSettings()
	abs, err := filepath.Abs(req.Path)
	if err != nil {
		abs = req.Path
	}
	stored, ok := settings[abs]
	if ok {
		if req.Version == "" {
			req.Version = stored.Version
		}
		if req.Prefix == "" {
			req.Prefix = stored.Prefix
		}
		if req.Wine == "" {
			req.Wine = stored.WineBinary
		}
	}

	args := []string{launcherScript, req.Path}
	if req.Version != "" {
		args = append(args, "--version", req.Version)
	}
	if req.Prefix != "" {
		args = append(args, "--prefix", req.Prefix)
	}
	if req.Wine != "" {
		args = append(args, "--wine", req.Wine)
	}

	cmd := exec.Command("node", args...)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	if err := cmd.Run(); err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		io.WriteString(w, `{"error":"`+escapeJSON(err.Error())+`"}`)
		return
	}

	settings[abs] = struct {
		Version    string `json:"version"`
		Prefix     string `json:"prefix"`
		WineBinary string `json:"wineBinary"`
	}{req.Version, req.Prefix, req.Wine}
	saveSettings(settings)
	w.Header().Set("Content-Type", "application/json")
	io.WriteString(w, `{"success":true}`)
}

func escapeJSON(s string) string {
	b, _ := json.Marshal(s)
	if len(b) >= 2 {
		return string(b[1 : len(b)-1])
	}
	return s
}

func handleGetTheme(w http.ResponseWriter, r *http.Request) {
	theme := loadTheme()
	w.Header().Set("Content-Type", "application/json")
	io.WriteString(w, `{"theme":"`+theme+`"}`)
}

func handlePostTheme(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Theme string `json:"theme"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "bad request", http.StatusBadRequest)
		return
	}
	if req.Theme != "light" && req.Theme != "dark" {
		http.Error(w, `{"error":"invalid theme"}`, http.StatusBadRequest)
		return
	}
	saveTheme(req.Theme)
	w.Header().Set("Content-Type", "application/json")
	io.WriteString(w, `{"success":true}`)
}

func main() {
	mux := http.NewServeMux()

	phoneURL, _ := url.Parse(getEnv("PHONE_BRIDGE_URL", "http://localhost:3002"))
	mux.Handle("/phonebridge/", http.StripPrefix("/phonebridge", phoneBridgeHandler(phoneURL)))
	mux.HandleFunc("/api/launch-proton", handleLaunchProton)
	mux.HandleFunc("/api/theme", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPost {
			handlePostTheme(w, r)
		} else if r.Method == http.MethodGet {
			handleGetTheme(w, r)
		} else {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		}
	})

	port := getEnv("PORT", "3001")
	log.Printf("Proton launcher server listening on port %s", port)
	log.Fatal(http.ListenAndServe(":"+port, mux))
}

func getEnv(k, def string) string {
	if v := os.Getenv(k); v != "" {
		return v
	}
	return def
}

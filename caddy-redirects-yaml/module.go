// Package caddy_redirects_yaml allows configuring redirects of sites using a given YAML file. It sets up 302 redirects from /to/{name} to {url}, given a yaml array of objects with name and url fields.
package caddy_redirects

import (
	"fmt"
	"net/http"
	"os"

	"github.com/caddyserver/caddy/v2"
	"github.com/caddyserver/caddy/v2/caddyconfig/caddyfile"
	"github.com/caddyserver/caddy/v2/caddyconfig/httpcaddyfile"
	"github.com/caddyserver/caddy/v2/modules/caddyhttp"
	"gopkg.in/yaml.v2"
)

func init() {
	httpcaddyfile.RegisterHandlerDirective("redirects", parseCaddyfile)
	caddy.RegisterModule(RedirectModule{})
}

// Redirect represents a single redirect rule.
type Redirect struct {
	Name string `yaml:"name"`
	URL  string `yaml:"url"`
}

// RedirectModule is the Caddy module that implements the redirect logic.
type RedirectModule struct {
	RulesFile string     `json:"rules,omitempty"`
	Redirects []Redirect `json:"-"`
}

// CaddyModule returns the Caddy module information.
func (RedirectModule) CaddyModule() caddy.ModuleInfo {
	return caddy.ModuleInfo{
		ID:  "http.handlers.redirects",
		New: func() caddy.Module { return new(RedirectModule) },
	}
}

// Provision sets up the module.
func (rm *RedirectModule) Provision(ctx caddy.Context) error {
	// Load and parse the YAML file
	data, err := os.ReadFile(rm.RulesFile)
	if err != nil {
		return fmt.Errorf("failed to read YAML file: %v", err)
	}
	if err := yaml.Unmarshal(data, &rm.Redirects); err != nil {
		return fmt.Errorf("failed to parse YAML file: %v", err)
	}
	return nil
}

// ServeHTTP implements the HTTP handler.
func (rm *RedirectModule) ServeHTTP(w http.ResponseWriter, r *http.Request, next caddyhttp.Handler) error {
	// Match the request path and perform the redirect
	for _, redirect := range rm.Redirects {
		if r.URL.Path == "/to/"+redirect.Name {
			http.Redirect(w, r, redirect.URL, http.StatusFound)
			return nil
		}
	}
	// If no match, continue to the next handler
	return next.ServeHTTP(w, r)
}

func parseCaddyfile(h httpcaddyfile.Helper) (caddyhttp.MiddlewareHandler, error) {
	var rm RedirectModule
	err := rm.UnmarshalCaddyfile(h.Dispenser)
	return &rm, err
}

// UnmarshalCaddyfile sets up the module from Caddyfile tokens.
func (rm *RedirectModule) UnmarshalCaddyfile(d *caddyfile.Dispenser) error {
	if !d.Args(&rm.RulesFile) {
		return d.Err("expected exactly one argument (YAML file path)")
	}

	return nil
}

// Interface guards
var (
	_ caddyhttp.MiddlewareHandler = (*RedirectModule)(nil)
	_ caddy.Provisioner           = (*RedirectModule)(nil)
	_ caddyfile.Unmarshaler       = (*RedirectModule)(nil)
)

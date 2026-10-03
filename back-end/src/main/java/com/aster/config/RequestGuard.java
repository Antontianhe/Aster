package com.aster.config;

import jakarta.servlet.*;
import jakarta.servlet.http.*;
import java.io.*;
import java.util.Set;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/** Keep the API local and require the existing same-origin frontend write header. */
@Component
public class RequestGuard extends OncePerRequestFilter {
  private static final Set<String> ORIGINS =
      Set.of(
          "http://localhost:5173",
          "http://127.0.0.1:5173",
          "http://localhost:4173",
          "http://127.0.0.1:4173");

  @Override
  protected void doFilterInternal(
      HttpServletRequest request, HttpServletResponse response, FilterChain chain)
      throws ServletException, IOException {
    response.setHeader("Cache-Control", "no-store");
    response.setHeader("X-Content-Type-Options", "nosniff");
    String host = request.getHeader("Host");
    boolean ownHost =
        ("127.0.0.1:" + request.getLocalPort()).equals(host)
            || ("localhost:" + request.getLocalPort()).equals(host);
    boolean frontendHost = host != null && ORIGINS.contains("http://" + host);
    if (!ownHost && !frontendHost) {
      deny(response, 403, "Host not allowed.");
      return;
    }
    if (!Set.of("GET", "HEAD").contains(request.getMethod())
        && (!ORIGINS.contains(
                request.getHeader("Origin") == null ? "" : request.getHeader("Origin"))
            || !"workspace".equals(request.getHeader("X-Aster-Client")))) {
      deny(response, 403, "Open Aster locally to make changes.");
      return;
    }
    if (Set.of("POST", "PUT", "PATCH").contains(request.getMethod())) {
      if (request.getContentLengthLong() > 2_000_000) {
        deny(response, 413, "This request is too large.");
        return;
      }
      byte[] bytes = request.getInputStream().readNBytes(2_000_001);
      if (bytes.length > 2_000_000) {
        deny(response, 413, "This request is too large.");
        return;
      }
      var wrapped =
          new HttpServletRequestWrapper(request) {
            @Override
            public ServletInputStream getInputStream() {
              ByteArrayInputStream stream = new ByteArrayInputStream(bytes);
              return new ServletInputStream() {
                public int read() {
                  return stream.read();
                }

                public boolean isFinished() {
                  return stream.available() == 0;
                }

                public boolean isReady() {
                  return true;
                }

                public void setReadListener(ReadListener listener) {
                  throw new UnsupportedOperationException();
                }
              };
            }

            @Override
            public BufferedReader getReader() {
              return new BufferedReader(
                  new InputStreamReader(getInputStream(), java.nio.charset.StandardCharsets.UTF_8));
            }
          };
      chain.doFilter(wrapped, response);
    } else chain.doFilter(request, response);
  }

  private void deny(HttpServletResponse res, int status, String message) throws IOException {
    res.setStatus(status);
    res.setContentType("application/json");
    res.getWriter().write(com.aster.util.Json.write(java.util.Map.of("error", message)));
  }
}

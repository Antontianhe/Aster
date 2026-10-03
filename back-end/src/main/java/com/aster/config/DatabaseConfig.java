package com.aster.config;

import com.zaxxer.hikari.*;
import java.nio.file.*;
import java.security.*;
import java.security.cert.CertificateFactory;
import java.util.HexFormat;
import org.springframework.context.annotation.*;

@Configuration
public class DatabaseConfig {
  @Bean(destroyMethod = "close")
  public HikariDataSource dataSource(LocalSettings settings) throws Exception {
    HikariConfig config = new HikariConfig();
    config.setJdbcUrl(
        "jdbc:mysql://"
            + settings.get("DB_HOST", "127.0.0.1")
            + ":"
            + settings.get("DB_PORT", "3306")
            + "/"
            + settings.get("DB_NAME", "aster"));
    config.setUsername(settings.get("DB_USER", "aster_app"));
    config.setPassword(settings.get("DB_PASSWORD", ""));
    config.setMaximumPoolSize(5);
    config.setConnectionTimeout(5000);
    config.setInitializationFailTimeout(10000);
    config.addDataSourceProperty("connectionTimeZone", "UTC");
    config.addDataSourceProperty("forceConnectionTimeZoneToSession", true);
    config.addDataSourceProperty("treatMysqlDatetimeAsTimestamp", true);
    config.addDataSourceProperty("characterEncoding", "UTF-8");
    config.addDataSourceProperty("allowMultiQueries", false);
    config.addDataSourceProperty("allowLoadLocalInfile", false);
    config.addDataSourceProperty("sslMode", "VERIFY_CA");
    // Connector/J uses a Java trust store. Build it from MySQL's existing private CA.
    KeyStore trust = KeyStore.getInstance("PKCS12");
    byte[] random = new byte[24];
    new SecureRandom().nextBytes(random);
    String password = HexFormat.of().formatHex(random);
    trust.load(null, password.toCharArray());
    try (var input = Files.newInputStream(settings.instance().resolve("data/ca.pem"))) {
      trust.setCertificateEntry(
          "aster-mysql", CertificateFactory.getInstance("X.509").generateCertificate(input));
    }
    Path store = Files.createTempFile(settings.instance(), "jdbc-trust-", ".p12");
    store.toFile().deleteOnExit();
    try (var output = Files.newOutputStream(store)) {
      trust.store(output, password.toCharArray());
    }
    config.addDataSourceProperty("trustCertificateKeyStoreUrl", store.toUri().toString());
    config.addDataSourceProperty("trustCertificateKeyStoreType", "PKCS12");
    config.addDataSourceProperty("trustCertificateKeyStorePassword", password);
    config.addDataSourceProperty("fallbackToSystemTrustStore", false);
    return new HikariDataSource(config);
  }
}

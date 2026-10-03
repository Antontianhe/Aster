package com.aster.security;

import java.nio.charset.StandardCharsets;
import java.security.*;
import java.util.HexFormat;
import java.util.concurrent.Semaphore;
import org.bouncycastle.crypto.generators.SCrypt;

public final class Passwords {
  private static final SecureRandom RANDOM = new SecureRandom();
  private static final Semaphore HASH_SLOTS = new Semaphore(2, true);
  private static final String DUMMY = hash("constant-time-dummy-password");

  private Passwords() {}

  public static String token(int size) {
    byte[] bytes = new byte[size];
    RANDOM.nextBytes(bytes);
    return HexFormat.of().formatHex(bytes);
  }

  public static String sha(String value) {
    try {
      return HexFormat.of()
          .formatHex(
              MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8)));
    } catch (NoSuchAlgorithmException e) {
      throw new IllegalStateException(e);
    }
  }

  private static byte[] derive(String password, String salt) {
    HASH_SLOTS.acquireUninterruptibly();
    try {
      return SCrypt.generate(
          password.getBytes(StandardCharsets.UTF_8),
          salt.getBytes(StandardCharsets.UTF_8),
          32768,
          8,
          1,
          64);
    } finally {
      HASH_SLOTS.release();
    }
  }

  public static String hash(String password) {
    String salt = token(16);
    return salt + ":" + HexFormat.of().formatHex(derive(password, salt));
  }

  public static boolean verify(String password, String encoded) {
    boolean valid = encoded != null && encoded.matches("[0-9a-f]{32}:[0-9a-f]{128}");
    String[] parts = (valid ? encoded : DUMMY).split(":");
    boolean equal =
        MessageDigest.isEqual(derive(password, parts[0]), HexFormat.of().parseHex(parts[1]));
    return valid && equal;
  }
}

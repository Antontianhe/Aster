package com.aster.service;

import static com.aster.util.Json.*;

import com.aster.security.Passwords;
import java.io.*;
import java.net.*;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.time.*;
import java.time.format.DateTimeFormatter;
import java.util.*;
import javax.crypto.*;
import javax.crypto.spec.*;
import javax.xml.XMLConstants;
import javax.xml.parsers.DocumentBuilderFactory;
import org.w3c.dom.*;

public final class FeedCodec {
  private FeedCodec() {}

  public static URI validate(String value) {
    try {
      URI u = URI.create(value);
      if (!"https".equals(u.getScheme())
          || !"lms.isr-school.com".equals(u.getHost())
          || (u.getPort() != -1 && u.getPort() != 443)
          || u.getUserInfo() != null
          || u.getFragment() != null
          || !u.getRawPath().matches("/news/feed/[a-zA-Z0-9_-]{12,128}"))
        throw new IllegalArgumentException();
      if (u.getRawQuery() != null)
        for (String p : u.getRawQuery().split("&"))
          if (!URLDecoder.decode(p.split("=", 2)[0], StandardCharsets.UTF_8).equals("topic"))
            throw new IllegalArgumentException();
      return u;
    } catch (Exception e) {
      throw new IllegalArgumentException("Use your private ISR Schoolbox news RSS link.");
    }
  }

  public static String encrypt(String value, byte[] key) throws Exception {
    byte[] iv = new byte[12];
    new SecureRandom().nextBytes(iv);
    Cipher c = Cipher.getInstance("AES/GCM/NoPadding");
    c.init(Cipher.ENCRYPT_MODE, new SecretKeySpec(key, "AES"), new GCMParameterSpec(128, iv));
    byte[] sealed = c.doFinal(value.getBytes(StandardCharsets.UTF_8));
    byte[] result = new byte[iv.length + sealed.length];
    System.arraycopy(iv, 0, result, 0, 12);
    System.arraycopy(sealed, sealed.length - 16, result, 12, 16);
    System.arraycopy(sealed, 0, result, 28, sealed.length - 16);
    return Base64.getEncoder().encodeToString(result);
  }

  public static String decrypt(String encoded, byte[] key) throws Exception {
    byte[] data = Base64.getDecoder().decode(encoded);
    if (data.length < 28) throw new IllegalArgumentException("Invalid encrypted feed");
    byte[] sealed = new byte[data.length - 12];
    System.arraycopy(data, 28, sealed, 0, data.length - 28);
    System.arraycopy(data, 12, sealed, data.length - 28, 16);
    Cipher c = Cipher.getInstance("AES/GCM/NoPadding");
    c.init(
        Cipher.DECRYPT_MODE,
        new SecretKeySpec(key, "AES"),
        new GCMParameterSpec(128, Arrays.copyOf(data, 12)));
    return new String(c.doFinal(sealed), StandardCharsets.UTF_8);
  }

  private static String field(Element e, String name) {
    NodeList nodes = e.getElementsByTagName(name);
    return nodes.getLength() == 0 ? "" : plain(nodes.item(0).getTextContent());
  }

  private static String plain(String s) {
    return s.replaceAll("<[^>]*>", " ")
        .replace("&amp;", "&")
        .replace("&lt;", "<")
        .replace("&gt;", ">")
        .replace("&quot;", "\"")
        .replace("&#39;", "'")
        .replaceAll("\\s+", " ")
        .trim();
  }

  public static List<Object> parseFeed(String xml) throws Exception {
    if (xml.toUpperCase(Locale.ROOT).contains("<!DOCTYPE")
        || xml.toUpperCase(Locale.ROOT).contains("<!ENTITY"))
      throw new IllegalArgumentException("Unsupported feed format.");
    DocumentBuilderFactory f = DocumentBuilderFactory.newInstance();
    f.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
    f.setFeature("http://xml.org/sax/features/external-general-entities", false);
    f.setFeature("http://xml.org/sax/features/external-parameter-entities", false);
    f.setXIncludeAware(false);
    f.setExpandEntityReferences(false);
    f.setAttribute(XMLConstants.ACCESS_EXTERNAL_DTD, "");
    f.setAttribute(XMLConstants.ACCESS_EXTERNAL_SCHEMA, "");
    var doc =
        f.newDocumentBuilder()
            .parse(new ByteArrayInputStream(xml.getBytes(StandardCharsets.UTF_8)));
    if (!doc.getDocumentElement().getTagName().equals("rss")
        || doc.getElementsByTagName("channel").getLength() == 0)
      throw new IllegalArgumentException("The feed did not return Schoolbox news.");
    var items = doc.getElementsByTagName("item");
    var result = new ArrayList<Object>();
    for (int i = 0; i < Math.min(items.getLength(), 80); i++) {
      Element item = (Element) items.item(i);
      String link = field(item, "link"), title = text(field(item, "title"), 300);
      try {
        URI u = URI.create(link);
        if (!"https".equals(u.getScheme())
            || !"lms.isr-school.com".equals(u.getHost())
            || u.getUserInfo() != null
            || title.isEmpty()) continue;
      } catch (Exception e) {
        continue;
      }
      String guid = field(item, "guid");
      String date = null;
      try {
        date =
            ZonedDateTime.parse(field(item, "pubDate"), DateTimeFormatter.RFC_1123_DATE_TIME)
                .toInstant()
                .toString();
      } catch (Exception ignored) {
      }
      result.add(
          map(
              "id",
              Passwords.sha(guid.isEmpty() ? link : guid).substring(0, 24),
              "title",
              title,
              "description",
              text(field(item, "description"), 1400),
              "url",
              link,
              "publishedAt",
              date));
    }
    return result;
  }
}

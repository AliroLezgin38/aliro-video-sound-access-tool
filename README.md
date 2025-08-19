# WebRTC Canlı Yayın (Kamera/Mikrofon)

Bu proje, kullanıcının bir linke gidip kamera/mikrofon izni vermesiyle arka planda WebRTC yayını başlatır ve siz Google Cloud Shell üzerinden aynı odaya bağlanarak canlı görüntü/ses izleyebilirsiniz.

## Bileşenler
- HTTP + WebSocket sunucu (Node.js)
- `public/capture.html`: İzin isteyen ve ardından yönlendiren sayfa
- `public/publisher.html`: Yayını başlatan arka plan sayfası
- `public/viewer.html`: İzleme sayfası (Cloud Shell Web Preview üzerinden açılır)

## Hızlı Başlangıç (Yerel/Windows)
1. Node 18+ kurulu olsun.
2. Kurulum:
```bash
npm install
```
3. Sunucuyu başlatın:
```bash
npm start
```
4. İzin linki:
   - `http://localhost:8080/capture.html?room=myroom&redirect=https%3A%2F%2Fexample.com`
   - Kullanıcı butona basar, izin verir; pop-up olarak yayıncı açılır ve ana sayfa redirect olur.
5. İzleyici:
   - Aynı makinede: `http://localhost:8080/viewer.html?room=myroom`

## Google Cloud Shell Üzerinde
1. Bu depoyu Cloud Shell'e kopyalayın veya dosyaları yükleyin.
2. Kurulum ve çalıştırma:
```bash
npm install
npm start
```
3. Cloud Shell Web Preview (üstteki göz simgesi) ile 8080 portunu ön izleyin.
4. İzleyici URL'si (Cloud Shell domain’inde):
   - `https://<cloudshell-preview-domain>/viewer.html?room=myroom`
5. Kullanıcı için paylaşılacak izin linki de aynı domain üzerinden olmalı:
   - `https://<cloudshell-preview-domain>/capture.html?room=myroom&redirect=https%3A%2F%2Fexample.com`

> Not: Tarayıcı güvenliği nedeni ile HTTPS üstünden erişim gerekir. Cloud Shell Web Preview zaten HTTPS sağlar.

## Güvenlik ve Notlar
- Bu örnek tek yayıncı + tek izleyici oda mantığı içerir. Geliştirme yapılabilir.
- NAT/Firewall arkası bağlantılarda ek TURN sunucusu gerekebilir. Burada yalnızca Google STUN kullanılmıştır. 
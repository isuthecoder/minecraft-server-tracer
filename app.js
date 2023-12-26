const fs = require('fs');
const mcSv = require('minecraft-ping');
const path = require('path');
const notifier = require('node-notifier');

const checkedIPs = new Set(); // Kontrol edilen IP adreslerini saklamak için küme

// TR.json dosyasını oku
fs.readFile('./datasets/TR.json', 'utf8', (err, data) => {
  if (err) {
    console.error(`Dosya okuma hatası: ${err.message}`);
    return;
  }

  try {
    const jsonData = JSON.parse(data);
    const ipRanges = jsonData.data || [];

    // Tüm IP adreslerini bir diziye topla
    const allIPs = [];
    ipRanges.forEach(ipRange => {
      const [startIp, endIp, _] = ipRange;
      for (let ip = parseInt(startIp.split('.')[3]); ip <= parseInt(endIp.split('.')[3]); ip++) {
        const targetIp = `${startIp.split('.').slice(0, 3).join('.')}.${ip}`;
        allIPs.push(targetIp);
      }
    });

    // IP adreslerini karıştır
    const shuffledIPs = shuffleArray(allIPs);

    // Karışık IP adreslerini kontrol et ve sonuçları JSON dosyasına yaz
    Promise.all(shuffledIPs.map((ip, index) => {
      // Rastgele gecikme ekleyerek istekleri düzenle
      const delay = index * 150; // Her bir isteği 2 saniye arayla gönder

      return new Promise(resolve => setTimeout(resolve, delay))
        .then(() => {
          mcSv.ping_fe01fa({ host: ip, port: 25565 }, function (err, response) {
            if (err) {
              return console.error(`${ip} adresinde sunucu bulunamadı.`);
            }

            if (response) {
              console.log(response);
              showNotification("Minecraft Server Tracker",ip+" Adresinde Sunucu Bulundu!")
              const currentDate = new Date();      

              const logFilePath = `./results.json`;

              // JSON dosyasını güncelle veya oluştur
              const jsonResults = [];
              if (fs.existsSync("./results.json")) {
                const existingData = fs.readFileSync("./results.json", 'utf8');
                jsonResults.push(JSON.parse(existingData));
              }
            else{
              fs.writeFileSync("./results.json","{}");
               }
              jsonResults.push({ ip, response });

              // Sonuçları JSON formatına dönüştür
              const updatedJsonResults = JSON.stringify(jsonResults);

              // JSON dosyasına yaz
              fs.writeFileSync("./results.json",updatedJsonResults);
              console.log('Sonuçlar dosyaya kaydedildi:', logFilePath);

              }
          });

          // Kontrol edilen IP'leri kümesine ekle
          checkedIPs.add(ip);
        })
        .catch(error => {

        });
    }));
  } catch (error) {
    console.error(`JSON parse hatası: ${error.message}`);
  }
});

// Diziyi karıştırmak için yardımcı fonksiyon
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
function showNotification(title, message) {
  notifier.notify({
    title: title,
    message: message,
    sound: true // Bildirim sesi
  });
}
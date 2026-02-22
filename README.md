# Esperienza AR per MIC
Semplice sito creato per l'esperienza di Augmented Reality per il museo delle ceramiche di Faenza.

## Metodo 1: Far partire la demo in un server node (metodo che ho utilizzato io)
- Requisiti: node, ngrok
- installare le dipendenze con npm install
- Per accendere il server locale
    ```bash
    node index.js
    ```
- Per inoltrare il traffico in un dominio certificato con una connessione https: 
    ```bash
    ngrok http  https://localhost:3000  
    ```

### Utilizzo
- Accedere al sito dal telefono (es. tramite il link fornito da ngrok). 
- Acconsentire all'utilizzo della fotocamera
- Inquadrare una delle immagini presenti sulle cartelle /media/
- Dovrebbe apparire il video sul marker inquadrato

## Metodo 2: nginx reverse proxy (produzione)
- Requisiti: node, nginx, certbot, VPS con dominio puntato
- Il flag `--http` avvia Node in modalità HTTP pura (senza certificati), delegando TLS a nginx.

### Utilizzo
1. Clonare il progetto sul server:
    ```bash
    git clone https://github.com/Fanter2033/ar_mic.git /var/www/ar-mic
    cd /var/www/ar-mic
    npm install
    ```

2. Configurare nginx:
    ```bash
    sudo cp nginx.conf /etc/nginx/sites-available/ar-mic
    sudo ln -s /etc/nginx/sites-available/ar-mic /etc/nginx/sites-enabled/
    ```
   Aprire dopo aver impostato il file ar-mic.conf come si deve (aver cambiato e inserito i riferimenti)

3. Testare e ricaricare nginx:
    ```bash
    sudo nginx -t && sudo systemctl reload nginx
    ```

### Disclaimer
Purtroppo, tutti i video dell'esperienza sono stati generati con Intelligenza Artificiale . Il mio lavoro si è limitato a creare la pagina web per la fruizione del materiale, non ho contribuito in alcun modo all'aspetto artistico e creativo del progetto
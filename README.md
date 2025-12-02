# Esperienza AR per MIC
Semplice sito creato per l'esperienza di Augmented Reality per il museo delle ceramiche di Faenza.

## Far partire la demo in un server node (metodo che ho utilizzato io)
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

## Utilizzo
- Accedere al sito dal telefono (es. tramite il link fornito da ngrok). 
- Acconsentire all'utilizzo della fotocamera
- Inquadrare una delle immagini presenti sulle cartelle /media/
- Dovrebbe apparire il video sul marker inquadrato

## Disclaimer
Purtroppo, tutti i video dell'esperienza sono stati generati con Intelligenza Artificiale . Il mio lavoro si è limitato a creare la pagina web per la fruizione del materiale, non ho contribuito in alcun modo all'aspetto artistico e creativo del progetto
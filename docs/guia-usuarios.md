Guia do Usuário - Melody Mix
============================

O que é
-------
- Um karaokê colaborativo: a tela do host vira o palco, convidados pedem músicas pelo celular e um admin ajuda a organizar a fila.
- Tudo acontece em tempo real. Se não houver conexão com YouTube, a busca mostra sugestões simuladas para ninguém ficar parado.

Como começar (host)
-------------------
- Acesse https://melody-mix-3i6y.onrender.com, escolha um nome para a festa e clique em **Criar Sala**.
- Na tela aparecem dois QR Codes:
  - **Convidados**: abre o pedido de músicas no celular.
  - **Admin**: painel de controle remoto (fica visível por 2 minutos para evitar compartilhamentos indevidos).
- Projete essa tela em uma TV ou telão; o player e os anúncios de quem vai cantar ficam aqui.

Host: o palco da festa
----------------------
- **Criar sala e compartilhar**: o código da sala fica no canto; use os QR Codes para chamar convidados e o admin.
- **Anúncio do cantor**: quando alguém pede uma música, aparece um cartão com o nome de quem vai cantar. Clique em **Iniciar apresentação** para liberar o vídeo.
- **Player e modo espera**: quando não há música, a tela mostra um QR grande para convidados entrarem.
- **Fila lateral**:
  - Arraste para reordenar.
  - **▶ Tocar agora** coloca a música no topo e anuncia o próximo cantor.
  - **✕ Remover** tira da fila.
  - **Adicionar**: pesquise, escolha a faixa e ela entra com o nome que você digitou.
- **Seguir o fluxo**: se algo travar, você pode tocar agora ou pular pelo admin para manter o ritmo.

Admin: o maestro remoto
-----------------------
- Entre pelo QR de admin ou link `admin/<roomId>`.
- **Playback**: Play, Pause e **⏭ Pular** para fazer a fila andar e anunciar o próximo cantor.
- **Fila**: remover itens, subir/descer posições e **▶** tocar agora.
- **Adicionar com prioridade**: busque a música, informe quem pediu e mande direto para a fila (útil para furar fila em casos especiais ou ajudar convidados).

Convidado: peça sua música
--------------------------
- Entre pelo QR de convidados ou link `guest/<roomId>`.
- Informe seu nome/apelido para entrar.
- Busque a música (a busca inclui “karaoke”) e toque no resultado para adicionar.
- Se suas duas últimas músicas já estão em sequência, o app pede para esperar antes de adicionar outra.
- Acompanhe a fila: suas músicas aparecem destacadas e a área “Tocando agora” mostra quem está no microfone.

Dicas rápidas
-------------
- Se a conexão cair, recarregue a página (o host mostra um alerta).
- Se a sala sumir, crie uma nova e compartilhe os novos QR Codes.
- Se o anúncio aparecer sem o vídeo tocar, clique em **Iniciar apresentação** no host ou admin.
- Fila parada? Use **Pular** ou **Tocar agora** no host/admin para retomar.

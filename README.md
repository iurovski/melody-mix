Melody Mix
==========

Karaokê colaborativo em tempo real com três papéis principais: o host cria a sala e projeta o player, convidados pedem músicas pelo celular e um admin remoto mantém a fila fluindo. Funciona via Socket.IO e busca no YouTube (usa mock se não houver API key).

- Guia do usuário (host, admin, convidado): `docs/guia-usuarios.md`
- Desenvolvimento: `npm run dev` inicia em `http://localhost:3000`
- Produção: `npm run build` e depois `npm run start`
- Qualidade: `npm run lint` para checar estilo

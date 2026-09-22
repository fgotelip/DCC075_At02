import express from 'express';
import { OAuth2Client } from 'google-auth-library';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

const client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI,
);

// função para definir o papel baseado no email
function definirPerfilRBAC(email) {
    if (email.endsWith('@estudante.ufjf.br')) {
        return 'Estudante';
    } else if (email.endsWith('@ufjf.br') || email.endsWith('@ufjf.edu.br')) {
        return 'Professor';
    } else {
        return 'Usuário Comum';
    }
}

app.get('/', (req, res) => {
    const url = client.generateAuthUrl({
        access_type: 'offline',
        scope: ['email', 'profile', 'openid'],
    });
    res.send(`<a href="${url}">Login com Google</a>`);
});

app.get('/callback', async (req, res) => {
    try {
        const { code } = req.query;
        const { tokens } = await client.getToken(code);
        client.setCredentials(tokens);
        
        const ticket = await client.verifyIdToken({
            idToken: tokens.id_token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        
        const payload = ticket.getPayload();
        const name = encodeURIComponent(payload.name);
        const email = encodeURIComponent(payload.email);
        
        // 1 aplica o conceito de RBAC usando o email do payload
        const role = definirPerfilRBAC(payload.email);
        const encodedRole = encodeURIComponent(role);
        
        // 2 redireciona passando a role
        res.redirect(`/welcome?name=${name}&email=${email}&role=${encodedRole}`);
    } catch (error) {
        console.error('Erro na autenticação:', error);
        res.status(500).send('Erro ao autenticar com o Google.');
    }
});

app.get('/welcome', (req, res) => {
    // 3 recebe a role na página autenticada
    const { name, email, role } = req.query;
    
    // 4 simula o controle de acesso visual na página
    let conteudoExclusivo = '';
    if (role === 'Professor') {
        conteudoExclusivo = `
            <div style="background-color: #d1ecf1; padding: 15px; border-radius: 5px;">
                <h3>Painel do Professor</h3>
                <p>Permissões habilitadas: Lançar notas, gerenciar turmas e editar diário.</p>
            </div>
        `;
    } else if (role === 'Estudante') {
        conteudoExclusivo = `
            <div style="background-color: #d4edda; padding: 15px; border-radius: 5px;">
                <h3>Painel do Estudante</h3>
                <p>Permissões habilitadas: Visualizar notas, baixar material de aula e entregar trabalhos.</p>
            </div>
        `;
    } else {
        conteudoExclusivo = `
            <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px;">
                <h3>Área Restrita</h3>
                <p>Você é um usuário comum. Seu acesso aos sistemas acadêmicos não está liberado.</p>
            </div>
        `;
    }

    // exibe o resultado na tela
    res.send(`
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1>Bem-vindo, ${name}!</h1>
            <p><strong>Seu e-mail:</strong> ${email}</p>
            <p><strong>Seu Perfil (RBAC):</strong> <span style="font-weight: bold; color: #d9534f;">${role}</span></p>
            <hr>
            ${conteudoExclusivo}
            <br>
            <a href="/">Voltar para o início</a>
        </div>
    `);
});

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});


app.get('/callback', async (req, res) => {
const { code } = req.query;
const { tokens } = await client.getToken(code);
console.log('Tokens recebidos do Google:', tokens); // print no terminal do token
client.setCredentials(tokens);
const ticket = await client.verifyIdToken({
idToken: tokens.id_token,
audience: process.env.GOOGLE_CLIENT_ID,
});
const payload = ticket.getPayload();
res.send(`Olá, ${payload.name}!`);
});
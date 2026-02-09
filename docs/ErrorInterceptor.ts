import axios, { AxiosError } from 'axios';
import { Mensagens } from '../../../constants/Mensagens';
import { authService } from '../../domain/AuthService';
import { parsefrom } from '../../dto/IErroDTO';

let isRedirecting = false;

const handleLogoutAndRedirect = async (mensagem?: string, silent: boolean = false) => {
    if (isRedirecting) return;
    isRedirecting = true;

    if (!silent) {
        window.dispatchEvent(
            new CustomEvent('sgf_logout_event', {
                detail: { message: mensagem || 'Sessão expirada. Redirecionando para o login...' },
            })
        );
        await new Promise((resolve) => setTimeout(resolve, 3000));
    }

    try {
        const authKeys = [
            'sgf_token',
            'sgf_user',
            'sgf_vinculos',
            'sgf_licenca_selecionada',
            'sgf_licenca_detalhes',
            'sgf_empresa_context',
        ];
        authKeys.forEach((key) => localStorage.removeItem(key));

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith('empresa_')) localStorage.removeItem(key);
        }

        authService.logoutLocal().catch(() => {});
    } catch (error) {
        console.error('Erro ao limpar cache local:', error);
    }

    window.location.href = '/login';
};

export const errorInterceptor = async (error: AxiosError) => {
    const originalRequest: any = error.config;
    const erroDTO = parsefrom(error);
    const codigoErro = erroDTO[0]?.codigo;

    if (error.message === 'Network Error') return Promise.reject(erroDTO);
    if (isRedirecting) return Promise.reject(error);

    const isLoginPage = window.location.pathname === '/login';
    if (isLoginPage) return Promise.reject(erroDTO);

    const isAuthPath = originalRequest.url?.includes('/auth/login') || originalRequest.url?.includes('/auth/logout');
    if (isAuthPath) return Promise.reject(erroDTO);

    const codigosLogout = [
        Mensagens.SESSAO_ENCERRADA.codigo,
        Mensagens.SEM_LICENCA_USUARIO.codigo,
        Mensagens.USUARIO_INATIVO_LICENCA.codigo,
        Mensagens.TOKEN_INVALIDO.codigo,
    ];

    if (codigoErro && codigosLogout.includes(codigoErro)) {
        const msg =
            codigoErro === Mensagens.SESSAO_ENCERRADA.codigo
                ? 'Sua sessão foi encerrada pelo administrador. Saindo da plataforma....'
                : undefined;

        const silent = codigoErro === Mensagens.TOKEN_INVALIDO.codigo || codigoErro === Mensagens.TOKEN_EXPIRADO.codigo;
        handleLogoutAndRedirect(msg, silent);
        return new Promise(() => {});
    }

    if (error.response?.status === 401) {
        handleLogoutAndRedirect(undefined, true);
        return new Promise(() => {});
    }

    return Promise.reject(erroDTO);
};

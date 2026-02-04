'use client'

import Link from 'next/link'
import { FaArrowLeft, FaShieldAlt } from 'react-icons/fa'

export default function PoliticaPrivacidade() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center text-blue-200 hover:text-white transition-colors mb-6"
          >
            <FaArrowLeft className="mr-2" />
            Voltar ao início
          </Link>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-600 p-3 rounded-xl">
                <FaShieldAlt className="text-white text-2xl" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Política de Privacidade</h1>
                <p className="text-blue-200">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 border border-white/20 prose prose-lg max-w-none">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introdução</h2>
          <p className="text-gray-700 mb-6">
            O Sistema de Ponto CM ("nós", "nosso" ou "Sistema") está comprometido em proteger a privacidade
            dos nossos usuários. Esta Política de Privacidade explica como coletamos, usamos, armazenamos
            e protegemos suas informações pessoais quando você utiliza nosso sistema de registro de ponto.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Informações que Coletamos</h2>
          <p className="text-gray-700 mb-4">Coletamos as seguintes informações:</p>
          <ul className="list-disc pl-6 text-gray-700 mb-6 space-y-2">
            <li><strong>Informações da conta Google:</strong> Nome, endereço de e-mail e foto do perfil fornecidos pelo Google durante o login.</li>
            <li><strong>Registros de ponto:</strong> Horários de entrada, saída, início e fim de almoço, e atividades de HTP.</li>
            <li><strong>Dados de localização:</strong> Coordenadas geográficas no momento do registro de ponto (quando autorizado).</li>
            <li><strong>Documentos de justificativa:</strong> Arquivos enviados para justificar ausências (atestados, licenças).</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Como Usamos suas Informações</h2>
          <p className="text-gray-700 mb-4">Utilizamos suas informações para:</p>
          <ul className="list-disc pl-6 text-gray-700 mb-6 space-y-2">
            <li>Autenticar seu acesso ao sistema</li>
            <li>Registrar e gerenciar seus horários de trabalho</li>
            <li>Permitir que coordenadores e administradores gerenciem a equipe</li>
            <li>Armazenar documentos de justificativa de ausências</li>
            <li>Gerar relatórios de frequência e horas trabalhadas</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Compartilhamento de Informações</h2>
          <p className="text-gray-700 mb-6">
            Suas informações são compartilhadas apenas com:
          </p>
          <ul className="list-disc pl-6 text-gray-700 mb-6 space-y-2">
            <li><strong>Coordenadores:</strong> Acesso aos registros de ponto dos funcionários de sua coordenação.</li>
            <li><strong>Administradores:</strong> Acesso completo para gestão do sistema.</li>
            <li><strong>Google:</strong> Para autenticação via OAuth e armazenamento de arquivos no Google Drive.</li>
            <li><strong>Firebase (Google Cloud):</strong> Para armazenamento seguro dos dados.</li>
          </ul>
          <p className="text-gray-700 mb-6">
            Não vendemos, alugamos ou compartilhamos suas informações pessoais com terceiros para fins de marketing.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Armazenamento e Segurança</h2>
          <p className="text-gray-700 mb-6">
            Seus dados são armazenados de forma segura utilizando:
          </p>
          <ul className="list-disc pl-6 text-gray-700 mb-6 space-y-2">
            <li>Firebase Firestore com criptografia em repouso e em trânsito</li>
            <li>Google Drive para armazenamento de documentos</li>
            <li>Conexões HTTPS criptografadas</li>
            <li>Autenticação OAuth 2.0 do Google</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Seus Direitos</h2>
          <p className="text-gray-700 mb-4">Você tem direito a:</p>
          <ul className="list-disc pl-6 text-gray-700 mb-6 space-y-2">
            <li>Acessar seus dados pessoais</li>
            <li>Solicitar correção de dados incorretos</li>
            <li>Solicitar exclusão de seus dados (sujeito a requisitos legais de retenção)</li>
            <li>Revogar o acesso do sistema à sua conta Google</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Cookies e Tecnologias Similares</h2>
          <p className="text-gray-700 mb-6">
            Utilizamos cookies essenciais para manter sua sessão de login ativa.
            Não utilizamos cookies de rastreamento ou publicidade.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Alterações nesta Política</h2>
          <p className="text-gray-700 mb-6">
            Podemos atualizar esta Política de Privacidade periodicamente.
            Notificaremos sobre alterações significativas através do sistema.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Contato</h2>
          <p className="text-gray-700 mb-6">
            Para dúvidas sobre esta Política de Privacidade ou sobre o tratamento de seus dados,
            entre em contato através do e-mail: <a href="mailto:contato@ponto-cm.com.br" className="text-blue-600 hover:underline">contato@ponto-cm.com.br</a>
          </p>

          <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-blue-800 text-sm">
              <strong>Sistema de Ponto CM</strong><br />
              Desenvolvido para gestão de ponto eletrônico<br />
              © {new Date().getFullYear()} - Todos os direitos reservados
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

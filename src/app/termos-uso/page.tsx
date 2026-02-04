'use client'

import Link from 'next/link'
import { FaArrowLeft, FaFileContract } from 'react-icons/fa'

export default function TermosUso() {
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
              <div className="bg-indigo-600 p-3 rounded-xl">
                <FaFileContract className="text-white text-2xl" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Termos de Uso</h1>
                <p className="text-blue-200">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 border border-white/20 prose prose-lg max-w-none">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Aceitação dos Termos</h2>
          <p className="text-gray-700 mb-6">
            Ao acessar e utilizar o Sistema de Ponto CM ("Sistema"), você concorda em cumprir e estar
            vinculado a estes Termos de Uso. Se você não concordar com qualquer parte destes termos,
            não deve utilizar o Sistema.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Descrição do Serviço</h2>
          <p className="text-gray-700 mb-6">
            O Sistema de Ponto CM é uma plataforma de gestão de ponto eletrônico que permite:
          </p>
          <ul className="list-disc pl-6 text-gray-700 mb-6 space-y-2">
            <li>Registro de entrada e saída do trabalho</li>
            <li>Controle de horário de almoço</li>
            <li>Registro de atividades de Horário de Trabalho Pedagógico (HTP)</li>
            <li>Envio de justificativas para ausências</li>
            <li>Gestão de equipes por coordenadores</li>
            <li>Geração de relatórios de frequência</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Cadastro e Conta</h2>
          <p className="text-gray-700 mb-6">
            Para utilizar o Sistema, você deve:
          </p>
          <ul className="list-disc pl-6 text-gray-700 mb-6 space-y-2">
            <li>Possuir uma conta Google válida</li>
            <li>Fazer login através da autenticação Google OAuth</li>
            <li>Aguardar aprovação de um administrador do sistema</li>
            <li>Fornecer informações verdadeiras e precisas</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Responsabilidades do Usuário</h2>
          <p className="text-gray-700 mb-4">Ao utilizar o Sistema, você concorda em:</p>
          <ul className="list-disc pl-6 text-gray-700 mb-6 space-y-2">
            <li>Registrar seus horários de forma precisa e honesta</li>
            <li>Não compartilhar sua conta com terceiros</li>
            <li>Não tentar burlar o sistema de geolocalização</li>
            <li>Enviar apenas documentos autênticos para justificativas</li>
            <li>Manter suas informações atualizadas</li>
            <li>Não utilizar o sistema para fins ilegais ou não autorizados</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Níveis de Acesso</h2>
          <p className="text-gray-700 mb-6">
            O Sistema possui três níveis hierárquicos de acesso:
          </p>
          <ul className="list-disc pl-6 text-gray-700 mb-6 space-y-2">
            <li><strong>Colaborador:</strong> Pode registrar seu próprio ponto e enviar justificativas.</li>
            <li><strong>Coordenador:</strong> Pode visualizar e gerenciar os registros de sua equipe.</li>
            <li><strong>Administrador:</strong> Acesso completo ao sistema, incluindo gestão de usuários e coordenações.</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Propriedade Intelectual</h2>
          <p className="text-gray-700 mb-6">
            O Sistema, incluindo seu design, código, funcionalidades e conteúdo, é protegido por
            direitos de propriedade intelectual. Você não pode copiar, modificar, distribuir ou
            criar trabalhos derivados sem autorização expressa.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Disponibilidade do Serviço</h2>
          <p className="text-gray-700 mb-6">
            Nos esforçamos para manter o Sistema disponível 24 horas por dia, 7 dias por semana.
            No entanto, não garantimos disponibilidade ininterrupta e não seremos responsáveis
            por interrupções temporárias devido a manutenção, atualizações ou problemas técnicos.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Limitação de Responsabilidade</h2>
          <p className="text-gray-700 mb-6">
            O Sistema é fornecido "como está". Não nos responsabilizamos por:
          </p>
          <ul className="list-disc pl-6 text-gray-700 mb-6 space-y-2">
            <li>Perda de dados devido a falhas técnicas</li>
            <li>Uso indevido do sistema por terceiros</li>
            <li>Decisões tomadas com base nos dados do sistema</li>
            <li>Danos indiretos ou consequentes</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Modificações nos Termos</h2>
          <p className="text-gray-700 mb-6">
            Reservamo-nos o direito de modificar estes Termos de Uso a qualquer momento.
            Alterações significativas serão comunicadas através do sistema. O uso continuado
            após modificações constitui aceitação dos novos termos.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Rescisão</h2>
          <p className="text-gray-700 mb-6">
            Podemos suspender ou encerrar seu acesso ao Sistema a qualquer momento, por qualquer
            motivo, incluindo violação destes Termos de Uso. Você também pode solicitar o
            encerramento de sua conta a qualquer momento.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Lei Aplicável</h2>
          <p className="text-gray-700 mb-6">
            Estes Termos de Uso são regidos pelas leis da República Federativa do Brasil.
            Qualquer disputa será submetida ao foro da comarca de Manaus, Estado do Amazonas.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Contato</h2>
          <p className="text-gray-700 mb-6">
            Para dúvidas sobre estes Termos de Uso, entre em contato através do e-mail:
            <a href="mailto:contato@ponto-cm.com.br" className="text-blue-600 hover:underline ml-1">contato@ponto-cm.com.br</a>
          </p>

          <div className="mt-8 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
            <p className="text-indigo-800 text-sm">
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

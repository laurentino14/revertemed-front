import { createFileRoute, Link } from '@tanstack/react-router'
import {
  Check,
  Clock,
  Eye,
  FileText,
  KeyRound,
  Lock,
  Sparkles,
  Upload,
  Users,
} from 'lucide-react'
import {
  Badge,
  HBar,
  LinkButton,
  Logo,
  MODULES,
  ModuleMark,
  btn,
} from '#/components/ui'
import type { ModuleKey } from '#/components/ui'

// Public page: server-rendered (SSR) for SEO and a fast first paint.
export const Route = createFileRoute('/')({
  head: () => ({
    meta: [
      {
        title:
          'ReverteMed · Recupere o dinheiro que os planos de saúde glosaram',
      },
      {
        name: 'description',
        content:
          'Importe seus arquivos TISS, veja quanto está perdendo e recorra de glosas com IA e contratos de cada operadora. Autorizações e recebíveis na mesma plataforma.',
      },
      { property: 'og:title', content: 'ReverteMed · Gestão de glosas com IA' },
      { property: 'og:type', content: 'website' },
    ],
  }),
  component: Landing,
})

const wrap = 'mx-auto w-full max-w-[1200px] px-6 lg:px-10'

function Landing() {
  return (
    <div className="bg-white">
      <header className={`${wrap} flex items-center justify-between py-5`}>
        <Link to="/" aria-label="ReverteMed">
          <Logo />
        </Link>
        <nav
          aria-label="Principal"
          className="hidden gap-9 text-[15px] font-medium text-ink-700 md:flex"
        >
          <a href="#como">Como funciona</a>
          <a href="#modulos">Módulos</a>
          <a href="#precos">Preços</a>
          <a href="#seguranca">Segurança</a>
        </nav>
        <div className="flex items-center gap-3">
          <LinkButton to="/login" variant="ghost">
            Entrar
          </LinkButton>
          <LinkButton to="/cadastro" className="hidden sm:inline-flex">
            Diagnóstico gratuito
          </LinkButton>
        </div>
      </header>

      <section className="bg-brand-50 py-16 lg:py-24">
        <div className={`${wrap} grid items-center gap-16 lg:grid-cols-2`}>
          <div className="flex flex-col gap-6">
            <Badge tone="brand" className="self-start">
              Para clínicas e prestadores de saúde
            </Badge>
            <h1 className="font-display text-5xl leading-[1.1] font-extrabold tracking-[-0.04em] lg:text-[56px]">
              Recupere o dinheiro que os planos de saúde glosaram.
            </h1>
            <p className="text-[19px] leading-relaxed text-ink-700">
              O ReverteMed importa seus arquivos TISS, mostra exatamente quanto
              você está perdendo e redige os recursos de glosa com IA, usando o
              contrato de cada operadora. Você só revisa e aprova.
            </p>
            <div className="flex flex-wrap gap-3">
              <LinkButton to="/cadastro" size="lg">
                Receber diagnóstico gratuito
              </LinkButton>
              <a href="#como" className={btn('secondary', 'lg')}>
                Ver como funciona
              </a>
            </div>
            <ul className="flex flex-wrap gap-x-5 gap-y-2 text-[13px] font-medium text-ink-700">
              {[
                'Padrão TISS (XML)',
                'LGPD desde o dia 1',
                'Revisão humana em cada recurso',
              ].map((t) => (
                <li key={t} className="flex items-center gap-1.5">
                  <Check className="size-4 text-brand-600" strokeWidth={2.5} />
                  {t}
                </li>
              ))}
            </ul>
          </div>

          <div
            className="flex flex-col gap-5 rounded-3xl border border-ink-200 bg-white p-7 shadow-[0_12px_32px_-4px_rgb(10_31_42/0.14)]"
            aria-hidden
          >
            <div className="flex items-center justify-between">
              <b className="text-sm text-ink-500">Outubro · Clínica Aurora</b>
              <Badge tone="success">Atualizado hoje</Badge>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-ink-200 p-4">
                <span className="text-[13px] text-ink-500">Glosado</span>
                <div className="num font-display text-[28px] font-extrabold text-danger">
                  R$ 148.320
                </div>
                <span className="text-xs text-ink-500">312 itens</span>
              </div>
              <div className="rounded-2xl border border-ink-200 p-4">
                <span className="text-[13px] text-ink-500">Recuperado</span>
                <div className="num font-display text-[28px] font-extrabold text-success">
                  R$ 82.410
                </div>
                <span className="text-xs text-ink-500">56% do glosado</span>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <b className="text-sm">Glosa por operadora</b>
              <HBar label="Unimed" value="R$ 52,1 mil" pct={78} />
              <HBar label="Bradesco Saúde" value="R$ 36,8 mil" pct={55} />
              <HBar label="SulAmérica" value="R$ 22,0 mil" pct={34} />
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-warning-bg p-4 text-[13px] font-medium">
              <Clock className="size-5 text-warning" />
              14 recursos vencem em 5 dias úteis. Revise agora.
            </div>
          </div>
        </div>
      </section>

      <section className="bg-brand-900 py-16 text-white">
        <div className={`${wrap} grid gap-12 md:grid-cols-3`}>
          {[
            [
              '15,89%',
              'glosa inicial média nos hospitais da Anahp em 2024, contra 11,89% em 2023',
            ],
            [
              '1,96%',
              'do valor glosado permaneceu suspenso após análise: a maior parte é indevida e pode ser revertida',
            ],
            [
              '87,1 dias',
              'prazo médio de recebimento dos convênios na Anahp em janeiro de 2026',
            ],
          ].map(([n, d]) => (
            <div key={n}>
              <b className="block font-display text-[52px] leading-none font-extrabold tracking-[-0.04em] text-mint">
                {n}
              </b>
              <p className="mt-3 text-[15px] text-brand-100">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="como" className="py-24">
        <div className={wrap}>
          <SectionHead
            eyebrow="Como funciona"
            title="Da glosa ao dinheiro na conta, em quatro passos"
            sub="O que antes levava horas por recurso passa a levar minutos."
          />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              [
                Upload,
                '1. Importe',
                'Envie os XMLs TISS de lotes e demonstrativos por upload ou pasta sincronizada.',
              ],
              [
                Eye,
                '2. Enxergue',
                'Veja quanto foi glosado, por operadora, motivo, procedimento e profissional.',
              ],
              [
                Sparkles,
                '3. Recorra',
                'A IA redige o recurso com a cláusula do contrato. Você revisa e aprova.',
              ],
              [
                Clock,
                '4. Acompanhe',
                'Prazos controlados, alertas antes do vencimento e valor recuperado em reais.',
              ],
            ].map(([Icon, t, d]) => {
              const I = Icon as typeof Upload
              return (
                <article
                  key={t as string}
                  className="flex flex-col gap-3.5 rounded-[20px] border border-ink-100 bg-ink-50 p-6"
                >
                  <span className="grid size-12 place-items-center rounded-[14px] bg-brand-100 text-brand-600">
                    <I className="size-6" />
                  </span>
                  <h3 className="font-display text-xl font-bold">
                    {t as string}
                  </h3>
                  <p className="text-[15px] text-ink-500">{d as string}</p>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      <section id="modulos" className="bg-ink-50 py-24">
        <div className={wrap}>
          <SectionHead
            eyebrow="Módulos"
            title="Uma plataforma para todo o ciclo de receita"
            sub="Comece por Glosas e ative os outros módulos sem retrabalho: eles compartilham a base de contratos e o histórico de pagamentos."
          />
          <div className="grid gap-6 lg:grid-cols-3">
            {(
              [
                [
                  'glosas',
                  'Recupere o que foi glosado',
                  'Importação TISS, conciliação item a item, recursos redigidos por IA, prazos e prevenção antes do envio.',
                  'Disponível',
                ],
                [
                  'aut',
                  'Autorize sem perder agenda',
                  'Leitura do pedido médico, checklist de documentos, prazos da RN 395, senhas e avisos ao paciente por WhatsApp.',
                  'Disponível',
                ],
                [
                  'rec',
                  'Saiba quanto e quando vai receber',
                  'Previsão de caixa por operadora, conciliação bancária, cobrança de atrasos e antecipação com parceiros.',
                  'Disponível',
                ],
              ] as [ModuleKey, string, string, string][]
            ).map(([k, t, d, s]) => (
              <article
                key={k}
                className="flex flex-col gap-4 rounded-[20px] border border-ink-200 bg-white p-7"
              >
                <div className="flex items-center justify-between">
                  <ModuleMark module={k} size={56} />
                  <Badge tone="success">{s}</Badge>
                </div>
                <div className="font-display text-base font-bold text-ink-500">
                  ReverteMed{' '}
                  <span className="font-extrabold text-ink-900">
                    {MODULES[k].name}
                  </span>
                </div>
                <h3 className="font-display text-2xl font-extrabold tracking-[-0.03em]">
                  {t}
                </h3>
                <p className="text-[15px] text-ink-500">{d}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="precos" className="py-24">
        <div className={wrap}>
          <SectionHead
            eyebrow="Preços"
            title="Você só paga a parte variável quando recebe"
            sub="Mensalidade fixa por faixa de volume e uma taxa por êxito sobre o valor efetivamente recuperado."
          />
          <div className="grid gap-6 md:grid-cols-2">
            <article className="flex flex-col gap-4 min-w-0 rounded-3xl border border-ink-200 p-6 sm:p-9">
              <h3 className="font-display text-[32px] font-extrabold tracking-[-0.03em]">
                Mensalidade
              </h3>
              <p className="text-base text-ink-500">
                Por faixa de guias processadas por mês
              </p>
              <b className="text-brand-600">Painel, conciliação e prevenção</b>
              <PriceList
                items={[
                  'Importação TISS ilimitada',
                  'Painel financeiro e de glosas',
                  'Alertas de prazo',
                  'Prevenção antes do envio',
                ]}
              />
              <LinkButton
                to="/cadastro"
                size="lg"
                className="whitespace-normal text-center"
              >
                Começar com diagnóstico gratuito
              </LinkButton>
            </article>
            <article className="flex flex-col gap-4 min-w-0 rounded-3xl bg-brand-900 p-6 text-white sm:p-9">
              <h3 className="font-display text-[32px] font-extrabold tracking-[-0.03em]">
                Taxa por êxito
              </h3>
              <p className="text-base text-brand-200">
                % do valor efetivamente recuperado
              </p>
              <b className="text-mint">Paga só quando o dinheiro entra</b>
              <PriceList
                dark
                items={[
                  'Recursos gerados pela IA',
                  'Revisão e aprovação humana',
                  'Acompanhamento até o desfecho',
                  'Relatório de valor recuperado',
                ]}
              />
              <LinkButton to="/cadastro" variant="accent" size="lg">
                Falar com a gente
              </LinkButton>
            </article>
          </div>
          <p className="mt-6 text-center text-sm text-ink-500">
            Valores definidos após o diagnóstico, a partir do valor médio
            recuperado por clínica. Terceirizadas de faturamento: plano por
            clínica ativa, com desconto por volume.
          </p>
        </div>
      </section>

      <section id="seguranca" className="bg-brand-50 py-24">
        <div className={`${wrap} grid items-center gap-16 lg:grid-cols-2`}>
          <div>
            <div className="mb-3 text-[13px] font-bold tracking-[0.14em] text-brand-600 uppercase">
              Segurança e LGPD
            </div>
            <h2 className="font-display text-4xl leading-[1.2] font-extrabold tracking-[-0.03em]">
              Dados de saúde exigem segurança desde a primeira versão
            </h2>
            <p className="mt-4 text-[17px] text-ink-700">
              A IA nunca recebe nome ou CPF do paciente, nunca inventa dados
              clínicos e todo recurso passa por aprovação humana.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              [
                Lock,
                'Criptografia',
                'Em trânsito e em repouso; backups criptografados.',
              ],
              [
                Users,
                'Acesso por perfil',
                'Auditoria de quem acessou e alterou cada dado.',
              ],
              [
                KeyRound,
                '2º fator',
                'Obrigatório para usuários administrativos.',
              ],
              [
                FileText,
                'Pseudonimização',
                'Identificação do paciente separada e restrita.',
              ],
            ].map(([Icon, t, d]) => {
              const I = Icon as typeof Lock
              return (
                <article
                  key={t as string}
                  className="flex flex-col gap-2 rounded-2xl border border-ink-200 bg-white p-5"
                >
                  <I className="size-6 text-brand-600" />
                  <h3 className="font-display text-[17px] font-bold">
                    {t as string}
                  </h3>
                  <p className="text-sm text-ink-500">{d as string}</p>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      <section className="bg-brand-700 py-24 text-center text-white">
        <div className={`${wrap} flex flex-col items-center gap-6`}>
          <h2 className="max-w-3xl font-display text-[44px] leading-[1.2] font-extrabold tracking-[-0.03em]">
            Descubra quanto sua clínica deixou de receber
          </h2>
          <p className="max-w-2xl text-lg text-brand-100">
            Envie os demonstrativos dos últimos 6 meses e receba um relatório
            com o valor glosado, o que ainda pode ser recuperado dentro do prazo
            e os motivos mais frequentes.
          </p>
          <LinkButton to="/cadastro" variant="accent" size="lg">
            Receber diagnóstico gratuito
          </LinkButton>
        </div>
      </section>

      <footer className="bg-ink-900 py-10 text-sm text-ink-300">
        <div
          className={`${wrap} flex flex-wrap items-center justify-between gap-4`}
        >
          <Logo dark size={32} />
          <nav aria-label="Rodapé" className="flex gap-6">
            <a href="#">Termos de uso</a>
            <a href="#">Política de privacidade</a>
            <a href="#seguranca">LGPD</a>
            <a href="#">Contato</a>
          </nav>
          <span>© 2026 ReverteMed</span>
        </div>
      </footer>
    </div>
  )
}

function SectionHead({
  eyebrow,
  title,
  sub,
}: {
  eyebrow: string
  title: string
  sub: string
}) {
  return (
    <div className="mx-auto mb-14 max-w-3xl text-center">
      <div className="mb-3 text-[13px] font-bold tracking-[0.14em] text-brand-600 uppercase">
        {eyebrow}
      </div>
      <h2 className="font-display text-4xl leading-[1.2] font-extrabold tracking-[-0.03em] lg:text-[40px]">
        {title}
      </h2>
      <p className="mt-3 text-[17px] text-ink-500">{sub}</p>
    </div>
  )
}

function PriceList({ items, dark }: { items: string[]; dark?: boolean }) {
  return (
    <ul className="flex flex-col gap-3">
      {items.map((i) => (
        <li key={i} className="flex items-center gap-2.5">
          <Check
            className={
              dark ? 'size-[18px] text-mint' : 'size-[18px] text-brand-600'
            }
            strokeWidth={2.5}
          />
          {i}
        </li>
      ))}
    </ul>
  )
}

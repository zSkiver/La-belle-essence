import type { Metadata } from "next";
import Link from "next/link";
import { Wordmark } from "@/components/brand/wordmark";
import { formatUnitAddress, siteConfig } from "@/lib/site-config";
import { hasAnalytics } from "@/lib/analytics";

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description:
    "Como a La Belle Essence RV trata as informações de quem visita o site e inicia atendimento pelo WhatsApp.",
  alternates: { canonical: "/politica-de-privacidade" },
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-line pt-8">
      <h2 className="font-display text-2xl text-ink">{title}</h2>
      <div className="mt-4 flex flex-col gap-4 text-sm leading-relaxed text-ink/80">
        {children}
      </div>
    </section>
  );
}

export default function PrivacyPolicyPage() {
  const analyticsEnabled = hasAnalytics();

  return (
    <div className="min-h-dvh">
      <header className="border-b border-line">
        <div className="shell flex h-20 items-center justify-between">
          <Link href="/" aria-label={`${siteConfig.name} — início`}>
            <Wordmark />
          </Link>
          <Link
            href="/"
            className="text-sm text-ink-muted underline-offset-4 transition-colors hover:text-ink hover:underline"
          >
            Voltar ao site
          </Link>
        </div>
      </header>

      <main className="shell max-w-3xl py-16 sm:py-24">
        <p className="eyebrow">Transparência</p>
        <h1 className="text-balance-tight mt-4 font-display text-4xl leading-tight text-ink sm:text-5xl">
          Política de Privacidade
        </h1>
        <p className="mt-5 text-sm leading-relaxed text-ink-muted">
          Este site é a vitrine da {siteConfig.legalName}. Ele não realiza vendas on-line, não possui
          carrinho e não processa pagamentos. Abaixo está, em linguagem direta, o que acontece com
          as informações enquanto você navega.
        </p>

        <div className="mt-14 flex flex-col gap-10">
          <Section title="Atendimento pelo WhatsApp">
            <p>
              Ao clicar em qualquer botão de WhatsApp, você escolhe a unidade e é levado para o
              aplicativo com uma mensagem já escrita. A conversa acontece inteiramente dentro do
              WhatsApp, entre você e a loja, sob os termos e a política de privacidade do próprio
              WhatsApp.
            </p>
            <p>
              O site não coleta seu nome, telefone ou qualquer dado de contato. Nada é preenchido
              por formulário aqui.
            </p>
          </Section>

          <Section title="Métricas de navegação">
            <p>
              Registramos que um clique de WhatsApp aconteceu, para entender quais perfumes despertam
              mais interesse. Esse registro guarda apenas: o produto e o volume consultados, a
              unidade escolhida, em que parte da página o botão foi clicado, a data e a hora, os
              parâmetros de campanha da URL (utm_source, utm_medium, utm_campaign) e o site de
              origem, quando existir.
            </p>
            <p>
              Não guardamos endereço IP, identificador de dispositivo ou qualquer informação que
              identifique você pessoalmente. Os registros são usados apenas de forma agregada, pela
              própria loja.
            </p>
          </Section>

          <Section title="Preferência de unidade">
            <p>
              A última unidade escolhida fica salva no armazenamento local do seu navegador
              (localStorage), com a única finalidade de já vir marcada na próxima vez. Essa
              informação não sai do seu aparelho e você pode trocar a unidade a qualquer momento.
              Limpar os dados de navegação apaga essa preferência.
            </p>
            <p>
              Parâmetros de campanha eventualmente presentes no link ficam guardados no
              armazenamento de sessão (sessionStorage) e são descartados quando você fecha a aba.
            </p>
          </Section>

          <Section title="Ferramentas de análise">
            {analyticsEnabled ? (
              <p>
                Este site utiliza ferramentas de análise de audiência configuradas pela loja, que
                podem registrar páginas visitadas e interações de forma agregada. Você pode bloquear
                esses scripts pelas configurações do seu navegador ou por extensões de privacidade.
              </p>
            ) : (
              <p>
                Nenhuma ferramenta de análise de terceiros está ativa no momento: o site não carrega
                Google Analytics, Meta Pixel ou scripts equivalentes. Por isso também não exibimos
                banner de cookies — não há cookies de rastreamento a consentir. Caso a loja passe a
                utilizar alguma ferramenta, esta página será atualizada.
              </p>
            )}
          </Section>

          <Section title="Cookies">
            <p>
              O site público não usa cookies de rastreamento. Cookies de sessão são utilizados
              apenas na área administrativa, restrita à equipe da loja, para manter o login ativo.
            </p>
          </Section>

          <Section title="Seus direitos e contato">
            <p>
              Você pode solicitar informações sobre os dados tratados, pedir correção ou exclusão,
              conforme a Lei Geral de Proteção de Dados (Lei nº 13.709/2018). Para isso, fale com a
              loja pelo WhatsApp de qualquer uma das unidades:
            </p>
            <ul className="flex flex-col gap-3">
              {siteConfig.units.map((unit) => (
                <li key={unit.id}>
                  <span className="block text-ink">{unit.name}</span>
                  <span className="block text-ink-muted">{formatUnitAddress(unit)}</span>
                  <span className="block text-ink-muted tabular-nums">
                    WhatsApp {unit.whatsappDisplay}
                  </span>
                </li>
              ))}
            </ul>
          </Section>

          <Section title="Alterações desta política">
            <p>
              Se a forma de tratar informações mudar — por exemplo, com a adoção de uma ferramenta
              de análise — esta página será revisada antes da mudança entrar em vigor.
            </p>
          </Section>
        </div>

        <p className="mt-14 border-t border-line pt-8 text-xs text-ink-faint">
          © {new Date().getFullYear()} {siteConfig.legalName}.
        </p>
      </main>
    </div>
  );
}

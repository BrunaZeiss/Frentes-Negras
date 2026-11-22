# Dados do Banco de Dados

Cada seção da página tem seu próprio arquivo JSON nesta pasta. Para adicionar um item, inclua um objeto na lista do arquivo correspondente:

- `publicacoes.json`: informe `autor`, `ano` e `veiculo`.
- `acervos.json`: informe `instituicao`, `endereco`, `o_que_guarda` e `como_acessar`.
- `audiovisual.json`: informe `formato`, `duracao` e `ano`.
- `noticias.json`: informe `veiculo` e `data`.
- `documentos-oficiais.json`: informe `orgao`, `numero`, `data` e `assunto`.
- `glossario.json`: informe `termo`, `definicao` (até três linhas) e `fonte`. Os termos aparecem em ordem alfabética.
- `iconografias.json`: informe `tipo_imagem`, `descricao_visual`, `alt_text`, `credito`, `licenca_ou_autorizacao`, `data_ou_periodo`, `local` e `imagem`.

Todos os objetos precisam ter `id` único, `titulo`, `tipo`, `tema` (lista com valores do filtro), `municipio`, `resumo`, `link`, `acesso` (`aberto`, `acervo físico` ou `sob consulta`) e `verificado` (`true` ou `false`). Use `link: ""` quando não houver fonte digital confirmada; itens não verificados recebem o selo “Em verificação”.

Em iconografias, deixe `imagem` vazia até que o arquivo autorizado esteja no próprio site. A imagem só é mostrada quando há texto alternativo, crédito e licença/autorização preenchidos e confirmados. Os arquivos JSON são carregados pelo navegador, portanto a página deve ser servida por HTTP (por exemplo, pelo servidor de desenvolvimento ou hospedagem do site), não aberta diretamente via `file://`.

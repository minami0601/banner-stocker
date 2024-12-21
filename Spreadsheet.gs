// スプレッドシートにデータを保存する関数
function saveToSpreadsheet(imageUrl, lpUrl, genre) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // 目次シートの取得または作成
  let indexSheet = ss.getSheetByName('目次');
  if (!indexSheet) {
    indexSheet = createIndexSheet(ss);
  }

  // ジャンル別シートの取得または作成
  let genreSheet = ss.getSheetByName(genre);
  if (!genreSheet) {
    genreSheet = createGenreSheet(ss, genre);
    updateIndexSheet(indexSheet, genre);
  }

  // データの追加
  const timestamp = new Date();
  genreSheet.appendRow([
    timestamp,
    imageUrl,
    `=IMAGE("${imageUrl}")`,
    lpUrl,
    genre
  ]);
}

// 目次シートを作成する関数
function createIndexSheet(ss) {
  const sheet = ss.insertSheet('目次');
  sheet.getRange('A1').setValue('ジャンル一覧');
  sheet.getRange('A2').setValue('クリックするとそれぞれのシートに移動できます');
  return sheet;
}

// ジャンル別シートを作成する関数
function createGenreSheet(ss, genre) {
  const sheet = ss.insertSheet(genre);
  const headers = ['日時', '画像URL', 'プレビュー', 'LP URL', 'ジャンル'];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

  // 列幅の設定
  sheet.setColumnWidth(3, 300); // プレビュー列を広めに
  return sheet;
}

// 目次シートを更新する関数
function updateIndexSheet(indexSheet, genre) {
  const lastRow = indexSheet.getLastRow();
  const formula = `=HYPERLINK("#gid=${SpreadsheetApp.getActiveSpreadsheet().getSheetByName(genre).getSheetId()}", "${genre}")`;
  indexSheet.getRange(lastRow + 1, 1).setFormula(formula);
}

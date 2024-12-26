// スプレッドシートのIDを設定
const SPREADSHEET_ID = '1e8cT09FlW2MHNt3VIiCyE-FLkEciUjgBdOG1HxV-lOI'; // ここにスプレッドシートのIDを入力してください

// スプレッドシートにデータを保存する関数
function saveToSpreadsheet(imageUrl, lpUrl, genre, memo = '') {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

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

  // IDの生成（連番）
  const lastRow = genreSheet.getLastRow();
  const id = lastRow > 1 ? lastRow - 1 : 1; // ヘッダー行を考慮して-1

  // URLの種類を判断
  let videoUrl = '';
  if (lpUrl.startsWith('動画:')) {
    videoUrl = lpUrl.replace('動画:', '').trim();
    lpUrl = '';
  }

  // データの追加（新しい列順序: ID, プレビュー, LP URL, 動画URL, FV, メモ, ジャンル）
  genreSheet.appendRow([
    id,
    `=IMAGE("${imageUrl}")`,
    lpUrl,
    videoUrl,
    '',  // FV（空欄）
    memo,
    genre
  ]);

  // 追加した行の高さを設定
  const newLastRow = genreSheet.getLastRow();
  genreSheet.setRowHeight(newLastRow, 100);  // 新しく追加した行の高さを100pxに設定

  // 追加した行のスタイルを設定
  const newRow = genreSheet.getRange(newLastRow, 1, 1, 7); // 7列に変更

  // プレビュー列（2列目）の中央揃え
  newRow.getCell(1, 2).setHorizontalAlignment('center')
                      .setVerticalAlignment('middle');

  // メモ列（6列目）の折り返し設定
  newRow.getCell(1, 6).setWrap(true);
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
  const headers = ['ID', 'プレビュー', 'LP URL', '動画URL', 'FV', 'メモ', 'ジャンル'];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

  // 列幅の設定
  sheet.setColumnWidth(1, 80);   // ID列
  sheet.setColumnWidth(2, 300);  // プレビュー列
  sheet.setColumnWidth(3, 200);  // LP URL列
  sheet.setColumnWidth(4, 200);  // 動画URL列
  sheet.setColumnWidth(5, 100);  // FV列
  sheet.setColumnWidth(6, 200);  // メモ列
  sheet.setColumnWidth(7, 100);  // ジャンル列

  // 行の高さの設定
  sheet.setRowHeight(1, 30);  // ヘッダー行を高めに
  sheet.setRowHeights(2, sheet.getMaxRows() - 1, 100);  // データ行を高めに（プレビュー画像用）

  // メモ列のスタイル設定
  const memoColumn = sheet.getRange(2, 6, sheet.getMaxRows() - 1, 1);
  memoColumn.setWrap(true);  // 折り返しを有効に

  // ヘッダー行のスタイル設定
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground('#f3f3f3')  // 背景色
            .setFontWeight('bold')      // 太字
            .setHorizontalAlignment('center')  // 中央揃え
            .setVerticalAlignment('middle');   // 垂直方向も中央揃え

  // データ行の中央揃え（プレビュー列）
  const previewColumn = sheet.getRange(2, 2, sheet.getMaxRows() - 1, 1);
  previewColumn.setHorizontalAlignment('center')
               .setVerticalAlignment('middle');

  return sheet;
}

// 目次シートを更新する関数
function updateIndexSheet(indexSheet, genre) {
  const lastRow = indexSheet.getLastRow();
  const formula = `=HYPERLINK("#gid=${SpreadsheetApp.getActiveSpreadsheet().getSheetByName(genre).getSheetId()}", "${genre}")`;
  indexSheet.getRange(lastRow + 1, 1).setFormula(formula);
}

// メモを更新する関数
function updateMemo(genre, rowIndex, memo) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(genre);

  if (!sheet) {
    throw new Error(`Sheet for genre "${genre}" not found`);
  }

  // メモ列（5列目）を更新
  sheet.getRange(rowIndex, 5).setValue(memo);
}

// 既存シートのスタイルを更新する関数
function updateSheetStyle(sheetName) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    throw new Error(`Sheet "${sheetName}" not found`);
  }

  // 列幅の設定
  sheet.setColumnWidth(1, 80);   // ID列
  sheet.setColumnWidth(2, 300);  // プレビュー列
  sheet.setColumnWidth(3, 200);  // LP URL列
  sheet.setColumnWidth(4, 100);  // FV列
  sheet.setColumnWidth(5, 200);  // メモ列
  sheet.setColumnWidth(6, 100);  // ジャンル列

  // 行の高さの設定
  sheet.setRowHeight(1, 30);  // ヘッダー行を高めに
  sheet.setRowHeights(2, sheet.getMaxRows() - 1, 100);  // データ行を高めに

  // メモ列のスタイル設定
  const memoColumn = sheet.getRange(2, 5, sheet.getMaxRows() - 1, 1);
  memoColumn.setWrap(true);  // 折り返しを有効に

  // ヘッダー行のスタイル設定
  const headerRange = sheet.getRange(1, 1, 1, 6);
  headerRange.setBackground('#f3f3f3')
            .setFontWeight('bold')
            .setHorizontalAlignment('center')
            .setVerticalAlignment('middle');

  // データ行の中央揃え（プレビュー列）
  const previewColumn = sheet.getRange(2, 2, sheet.getMaxRows() - 1, 1);
  previewColumn.setHorizontalAlignment('center')
               .setVerticalAlignment('middle');
}

// 全シートのスタイルを更新する関数
function updateAllSheetsStyle() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheets = ss.getSheets();

  for (const sheet of sheets) {
    const sheetName = sheet.getName();
    if (sheetName !== '目次') {  // 目次シート以外を更新
      try {
        updateSheetStyle(sheetName);
        console.log(`Updated style for sheet: ${sheetName}`);
      } catch (error) {
        console.error(`Error updating sheet ${sheetName}:`, error);
      }
    }
  }
}

// 特定の行の高さを修正する関数
function adjustRowHeight(sheetName, rowIndex, height = 100) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    throw new Error(`Sheet "${sheetName}" not found`);
  }

  sheet.setRowHeight(rowIndex, height);
}

// 特定のシートの全データ行の高さを修正する関数
function adjustAllRowHeights(sheetName, height = 100) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    throw new Error(`Sheet "${sheetName}" not found`);
  }

  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {  // ヘッダー行以外を処理
    sheet.setRowHeights(2, lastRow - 1, height);
  }
}

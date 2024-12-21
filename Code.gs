// Webhookのヘルスチェック用エンドポイント
function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({ status: 'ok' }))
    .setMimeType(ContentService.MimeType.JSON);
}

// Chatworkからのwebhookを受け取るエンドポイント
function doPost(e) {
  try {
    // リクエストデータの取得
    const data = JSON.parse(e.postData.contents);

    // メッセージの処理
    processMessage(data);

    return ContentService.createTextOutput(JSON.stringify({ status: 'success' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    console.error('Error in doPost:', error);
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// メッセージを処理する関数
function processMessage(data) {
  console.log('Received webhook data:', JSON.stringify(data));

  const message = data.webhook_event;
  const messageId = message.message_id;
  const roomId = message.room_id;
  const messageBody = message.body;

  console.log('Processing message:', {
    messageId,
    roomId,
    messageBody
  });

  // 画像、URL、ジャンル、メモを抽出
  const imageUrl = extractImageUrl(roomId, messageId);
  const lpUrl = extractLpUrl(messageBody);
  const genre = extractGenre(messageBody);
  const memo = extractMemo(messageBody);

  console.log('Extracted information:', {
    hasImage: !!imageUrl,
    hasUrl: !!lpUrl,
    hasGenre: !!genre,
    genre: genre,
    memo: memo
  });

  if (!imageUrl || !lpUrl || !genre) {
    console.log('Required information missing:', {
      hasImage: !!imageUrl,
      hasUrl: !!lpUrl,
      hasGenre: !!genre
    });
    return;
  }

  // スプレッドシートに保存
  console.log('Saving to spreadsheet:', {
    imageUrl,
    lpUrl,
    genre,
    memo
  });

  saveToSpreadsheet(imageUrl, lpUrl, genre, memo);
  console.log('Successfully saved to spreadsheet');
}

// 画像URLを抽出する関数
function extractImageUrl(roomId, messageId) {
  try {
    // メッセージに添付されたファイルを取得
    const files = getChatworkMessageFiles(roomId, messageId);

    // 画像ファイルを探す
    const imageFile = files.find(file =>
      file.filename.match(/\.(jpg|jpeg|png|gif)$/i)
    );

    if (!imageFile) {
      return null;
    }

    // 画像のダウンロードURLを取得
    const downloadUrl = getDownloadableImageUrl(roomId, imageFile.file_id);

    // 画像をGoogle Driveに保存
    return saveImageToDrive(downloadUrl, imageFile.filename);
  } catch (error) {
    console.error('Error extracting image URL:', error);
    return null;
  }
}

// 画像をGoogle Driveに保存する関数
function saveImageToDrive(imageUrl, filename) {
  const folder = getDriveFolder();
  const response = UrlFetchApp.fetch(imageUrl);
  const blob = response.getBlob();
  const file = folder.createFile(blob);
  file.setName(filename);

  // 共有設定を変更
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  // スプレッドシートのIMAGE関数で表示可能なURLを生成
  const fileId = file.getId();
  return `https://drive.google.com/uc?export=view&id=${fileId}`;
}

// Google Driveのフォルダを取得または作成する関数
function getDriveFolder() {
  const folderName = 'BannerStock Images';
  const folders = DriveApp.getFoldersByName(folderName);

  if (folders.hasNext()) {
    return folders.next();
  }

  return DriveApp.createFolder(folderName);
}

// LPのURLを抽出する関数
function extractLpUrl(message) {
  // URLを正規表現で抽出
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const matches = message.match(urlRegex);
  return matches ? matches[0] : null;
}

// ジャンルを抽出する関数
function extractGenre(message) {
  // ジャンルタグを探す（例: 「ジャンル：美容」や「#美容」など）
  const genreMatch = message.match(/(?:ジャンル[：:]\s*|#)([^\s\n]+)/);

  if (genreMatch && genreMatch[1]) {
    return genreMatch[1];
  }

  return null;
}

// テモを抽出する関数
function extractMemo(message) {
  // メモタグを探す（例: 「メモ：ここにメモ」や「※ここにメモ」など）
  const memoMatch = message.match(/(?:メモ[：:]\s*|※\s*)([^\n]+)/);

  if (memoMatch && memoMatch[1]) {
    return memoMatch[1].trim();
  }

  return '';  // メモがない場合は空文字を返す
}

// テスト用の関数
function testProcessMessage() {
  // テスト用のWebhookデータを作成
  const testData = {
    webhook_event: {
      message_id: "test_message_id",
      room_id: 123456,
      body: "テスト投稿です\nhttps://example.com/test\nジャンル：テスト\nメモ：これはテストメモです",
      account: {
        account_id: 123456,
        name: "Test User"
      },
      send_time: Date.now()
    }
  };

  console.log('Starting test with data:', JSON.stringify(testData, null, 2));

  // processMessage関数を実行
  processMessage(testData);
}

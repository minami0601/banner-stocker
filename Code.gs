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
  const message = data.webhook_event;
  const roomId = message.room_id;
  const messageBody = message.body;

  // 画像、URL、ジャンルを抽出
  const imageUrl = extractImageUrl(message);
  const lpUrl = extractLpUrl(messageBody);
  const genre = extractGenre(messageBody);

  if (!imageUrl || !lpUrl || !genre) {
    console.log('Required information missing:', {
      hasImage: !!imageUrl,
      hasUrl: !!lpUrl,
      hasGenre: !!genre
    });
    return;
  }

  // スプレッドシートに保存
  saveToSpreadsheet(imageUrl, lpUrl, genre);
}

// 画像URLを抽出する関数
function extractImageUrl(message) {
  try {
    const messageId = message.message_id;
    const roomId = message.room_id;

    // メッセージに添付されたファイルを取得
    const files = getChatworkMessageFiles(roomId, messageId);

    // 画像ファイルを探す
    const imageFile = files.find(file =>
      file.filename.match(/\.(jpg|jpeg|png|gif)$/i)
    );

    if (!imageFile) {
      return null;
    }

    // 画像をGoogle Driveに保存し、永続的なURLを取得
    return saveImageToDrive(getDownloadableImageUrl(roomId, imageFile.file_id), imageFile.filename);
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

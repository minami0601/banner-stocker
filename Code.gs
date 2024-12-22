// Webhookのヘルスチェック用エンドポイント
function doGet(e) {
  console.log('Received GET request:', JSON.stringify(e));
  return ContentService.createTextOutput(JSON.stringify({ status: 'ok' }))
    .setMimeType(ContentService.MimeType.JSON);
}

// Chatworkからのwebhookを受け取るエンドポイント
function doPost(e) {
  console.log('Received POST request. Starting processing...');

  try {
    // リクエストデータの取得と検証
    if (!e || !e.postData || !e.postData.contents) {
      console.error('Invalid request format:', JSON.stringify(e));
      throw new Error('Invalid request format');
    }

    // リクエストデータの解析
    console.log('Raw request data:', e.postData.contents);
    const data = JSON.parse(e.postData.contents);
    console.log('Parsed webhook data:', JSON.stringify(data, null, 2));

    // webhook_eventの存在確認
    if (!data.webhook_event) {
      console.error('webhook_event not found in data');
      throw new Error('webhook_event not found');
    }

    // メッセージの処理
    const result = processMessage(data);
    console.log('Message processing result:', result);

    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      message: 'Webhook processed successfully'
    }))
    .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    console.error('Error in doPost:', error.message);
    console.error('Error stack:', error.stack);

    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString()
    }))
    .setMimeType(ContentService.MimeType.JSON);
  }
}

// メッセージを処理する関数
function processMessage(data) {
  console.log('Starting message processing...');

  try {
    const message = data.webhook_event;
    const messageId = message.message_id;
    const roomId = message.room_id;
    const messageBody = message.body;

    console.log('Message details:', {
      messageId,
      roomId,
      messageBody
    });

    // 画像、URL、ジャンル、メモを抽出
    console.log('Extracting image URL...');
    const files = getChatworkMessageFiles(roomId, messageId);
    console.log('Retrieved files:', files);

    let imageUrl = null;
    if (files && files.length > 0) {
      console.log('Getting download URL for file:', files[0]);
      const downloadUrl = getDownloadableImageUrl(roomId, files[0].file_id);
      console.log('Got download URL:', downloadUrl);

      if (downloadUrl) {
        // 画像をGoogle Driveに保存
        console.log('Saving image to Drive...');
        imageUrl = saveImageToDrive(downloadUrl, files[0].filename);
        console.log('Saved image to Drive, URL:', imageUrl);
      }
    }

    console.log('Extracting LP URL...');
    const lpUrl = extractLpUrl(messageBody);
    console.log('Extracted LP URL:', lpUrl);

    console.log('Extracting genre...');
    const genre = extractGenre(messageBody);
    console.log('Extracted genre:', genre);

    console.log('Extracting memo...');
    const memo = extractMemo(messageBody);
    console.log('Extracted memo:', memo);

    // 必要な情報が揃っているか確認
    if (!imageUrl || !lpUrl || !genre) {
      console.log('Required information missing:', {
        hasImage: !!imageUrl,
        hasUrl: !!lpUrl,
        hasGenre: !!genre,
        genre: genre
      });
      return {
        status: 'error',
        message: 'Required information missing'
      };
    }

    // スプレッドシートに保存
    console.log('Saving to spreadsheet with data:', {
      imageUrl,
      lpUrl,
      genre,
      memo
    });
    saveToSpreadsheet(imageUrl, lpUrl, genre, memo);
    console.log('Successfully saved to spreadsheet');

    return {
      status: 'success',
      message: 'Message processed successfully'
    };

  } catch (error) {
    console.error('Error in processMessage:', error);
    throw error;
  }
}

// 画像URLを抽出する関数
function extractImageUrl(roomId, messageId) {
  try {
    // メッセージに添付されたファイルを取得
    const files = getChatworkMessageFiles(roomId, messageId);
    console.log('Retrieved files:', files);

    if (!files || files.length === 0) {
      console.log('No files found in message');
      return null;
    }

    // 画像ファイルを探す
    const imageFile = files.find(file =>
      file.filename.match(/\.(jpg|jpeg|png|gif)$/i)
    );

    if (!imageFile) {
      console.log('No image file found in message');
      return null;
    }

    console.log('Found image file:', imageFile);

    // 画像のダウンロードURLを取得
    const downloadUrl = getDownloadableImageUrl(roomId, imageFile.file_id);
    console.log('Got download URL:', downloadUrl);

    if (!downloadUrl) {
      console.log('Failed to get download URL');
      return null;
    }

    // 画像をGoogle Driveに保存
    return saveImageToDrive(downloadUrl, imageFile.filename);

  } catch (error) {
    console.error('Error extracting image URL:', error);
    return null;
  }
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

// 画像をGoogle Driveに保存する関数
function saveImageToDrive(downloadUrl, filename) {
  console.log('Saving image to Drive:', { downloadUrl, filename });

  try {
    // 画像をダウンロード
    const response = UrlFetchApp.fetch(downloadUrl);
    const blob = response.getBlob();

    // フォルダを取得または作成
    const folder = getDriveFolder();

    // ファイルを作成
    const file = folder.createFile(blob);
    file.setName(filename);

    // 共有設定を変更（リンクを知っている人は誰でも閲覧可能）
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    // スプレッドシートのIMAGE関数で表示可能なURLを生成
    const fileId = file.getId();
    const driveUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;

    console.log('Successfully saved image to Drive:', driveUrl);
    return driveUrl;

  } catch (error) {
    console.error('Error saving image to Drive:', error);
    console.error('Error details:', error.message);
    return null;
  }
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

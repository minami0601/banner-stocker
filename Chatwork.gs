// Chatwork APIのベースURL
const CHATWORK_API_BASE = 'https://api.chatwork.com/v2';

// メッセージに添付されたファイルを取得する関数（テスト用）
function getChatworkMessageFiles(roomId, messageId) {
  console.log('Getting files for message:', { roomId, messageId });

  // テスト用のダミーデータを返す
  return [{
    file_id: "test_file_id",
    filename: "test_banner.jpg",
    filesize: 12345,
    message_id: messageId,
    upload_time: Date.now()
  }];
}

// 画像のダウンロードURLを取得する関数（テスト用）
function getDownloadableImageUrl(roomId, fileId) {
  console.log('Getting download URL for file:', { roomId, fileId });

  // テスト用のダミー画像URL（実際のバナーサイズに近い画像を返す）
  return "https://picsum.photos/600/300";
}

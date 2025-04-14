const { google } = require("googleapis");
const axios = require("axios");
const fs = require("fs");

// 환경 설정
const SPREADSHEET_ID = "1tITi6GX71wZ7ZjLtQQ8C1FXsKQxc7Y1DbRlINJmHRcM";
const RANGE = "설문지 응답 시트1"; // 정확한 시트 이름으로 바꿔야 할 수 있음
const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/당신의_URL";

const auth = new google.auth.GoogleAuth({
  keyFile: "./key/test-456802-6ac27b7c623e.json",
  scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
});

let previousRowCount = 0;

async function checkForNewRows() {
  const client = await auth.getClient();
  const sheets = google.sheets({ version: "v4", auth: client });

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: RANGE,
  });

  const rows = res.data.values;
  if (!rows || rows.length < 2) {
    console.log("데이터 없음 또는 헤더만 있음.");
    return;
  }

  const currentRowCount = rows.length;

  if (currentRowCount > previousRowCount) {
    const newRows = rows.slice(previousRowCount);

    for (let i = 0; i < newRows.length; i++) {
      const rowData = newRows[i];

      const joinTime = rowData[0] || "없음";
      const name = rowData[2] || "이름 없음";
      const studentId = rowData[3] || "학번 없음";
      const birth = rowData[4] || "생년월일 없음";
      const contact = rowData[5] || "연락처 없음";
      const why = rowData[8] || "지원 동기 없음";
      const what = rowData[9] || "얻어가고 싶은 것 없음";
      const pm = rowData[10] || "기획 경험 없음";
      const dev = rowData[11] || "개발 경험 없음";
      const design = rowData[12] || "디자인 경험 없음";
      const totalApplicants = currentRowCount - 2;

      const message = `${name}님이 스터디를 신청했어요🎉🎉.\n정보는 다음과 같습니다:\n\n신청시간: "${joinTime}", \n학번: "${studentId}", \n연락처: "${contact}", \n\n지원동기: "${why}"\n얻어가고 싶은 것: "${what}"\n\n기획경험: "${pm}"\n개발경험: "${dev}"\n디자인경험: "${design}"\n지금까지 총 ${totalApplicants}명이 신청했어요!`;

      const embed = {
        content: "",
        embeds: [
          {
            title: "알람 등장!",
            color: 33023,
            fields: [
              {
                name: "신규 신청 알림",
                value: message,
                inline: false,
              },
            ],
          },
        ],
      };

      await axios.post(DISCORD_WEBHOOK_URL, embed);
      console.log("✅ 디스코드 전송 완료");
    }

    previousRowCount = currentRowCount;
  } else {
    console.log("변화 없음");
  }
}

// 최초 1회 실행
checkForNewRows().then(() => {
  console.log("✅ 최초 체크 완료, 주기적 확인 시작");
});

// 주기적으로 확인
setInterval(checkForNewRows, 30 * 1000);

// ONLY showing modified report creation section

if (action === "report") {
  const fullMessages = await Message.find({
    $or: [
      { fromEmail: meEmail, toEmail: otherEmail },
      { fromEmail: otherEmail, toEmail: meEmail },
    ],
  })
    .sort({ createdAt: 1 })
    .lean();

  await MessageReport.create({
    reporterEmail: meEmail,
    reporterUsername: (await Page.findOne({ owner: meEmail }).lean())?.uri || "",
    reportedEmail: otherEmail,
    reportedUsername: targetPage.uri,
    reason,

    messageLog: fullMessages.map((m) => ({
      fromUsername: m.fromEmail === meEmail ? "reporter" : targetPage.uri,
      fromEmail: m.fromEmail,
      body: m.body,
      createdAt: m.createdAt,
    })),

    recentMessages: fullMessages.slice(-10).map((m) => ({
      fromUsername: m.fromEmail === meEmail ? "reporter" : targetPage.uri,
      fromEmail: m.fromEmail,
      body: m.body,
      createdAt: m.createdAt,
    })),
  });

  return NextResponse.json({ ok: true });
}

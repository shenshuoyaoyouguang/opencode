import z from "zod"
import { Tool } from "./tool"
import { Question } from "../question"
import DESCRIPTION from "./question.txt"

export const QuestionTool = Tool.define("question", {
  description: DESCRIPTION,
  parameters: z.object({
    questions: z.array(Question.Info.omit({ custom: true })).describe("Questions to ask"),
  }),
  async execute(params, ctx) {
    const answers = await Question.ask({
      sessionID: ctx.sessionID,
      questions: params.questions,
      tool: ctx.callID ? { messageID: ctx.messageID, callID: ctx.callID } : undefined,
    })

    function media(url: string): string {
      if (!url.startsWith("data:")) return url
      const comma = url.indexOf(",")
      if (comma === -1) return url
      const prefix = url.slice(0, comma + 1)
      const body = url.slice(comma + 1)
      if (body.startsWith("data:")) {
        const extracted = media(body)
        if (extracted.startsWith("data:")) {
          const extractedComma = extracted.indexOf(",")
          if (extractedComma !== -1) {
            return prefix + extracted.slice(extractedComma + 1)
          }
        }
        return prefix + extracted
      }
      return prefix + body
    }

    type ImageAnswer = {
      type: "image"
      mime: string
      url: string
      filename?: string
    }

    const isImageAnswer = (value: unknown): value is ImageAnswer => {
      return (
        typeof value === "object" &&
        value !== null &&
        "type" in value &&
        value.type === "image" &&
        "mime" in value &&
        typeof value.mime === "string" &&
        "url" in value &&
        typeof value.url === "string"
      )
    }

    function format(answer: readonly unknown[] | undefined) {
      if (!answer?.length) return "Unanswered"
      return answer
        .map((item) => {
          if (isImageAnswer(item)) {
            return `[image: ${item.filename ?? "image"}]`
          }
          return String(item)
        })
        .join(", ")
    }

    const formatted = params.questions.map((q, i) => `"${q.question}"="${format(answers[i] as unknown[] | undefined)}"`).join(", ")
    const attachments: Array<{ type: "file"; mime: string; url: string; filename?: string }> = []
    for (const answer of answers) {
      if (!answer) continue
      for (const item of answer as unknown[]) {
        if (isImageAnswer(item)) {
          attachments.push({
            type: "file",
            mime: item.mime,
            url: media(item.url),
            filename: item.filename,
          })
        }
      }
    }

    return {
      title: `Asked ${params.questions.length} question${params.questions.length > 1 ? "s" : ""}`,
      output: `User has answered your questions: ${formatted}. You can now continue with the user's answers in mind.`,
      metadata: {
        answers,
      },
      attachments: attachments.length > 0 ? attachments : undefined,
    }
  },
})
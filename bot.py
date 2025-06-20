import asyncio
from aiogram import Bot, Dispatcher, types
from aiogram.types import WebAppInfo, ReplyKeyboardMarkup, KeyboardButton

# Вставь токен своего бота
TOKEN = "7901700367:AAFZcoL1NWWrEhtwQFBury02pivHMfzCnzU"

bot = Bot(token=TOKEN)
dp = Dispatcher()

@dp.message()
async def send_webapp(msg: types.Message):
    kb = ReplyKeyboardMarkup(resize_keyboard=True)
    kb.add(KeyboardButton("Открыть кабинет", web_app=WebAppInfo(url="https://dreitann.github.io/Medusa_Project/")))
    await msg.answer("Добро пожаловать в Личный кабинет 👨‍🎓", reply_markup=kb)

if __name__ == "__main__":
    asyncio.run(dp.start_polling(bot))

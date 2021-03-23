defmodule Server.Router do
  use Plug.Router

  plug(:match)

  plug Plug.Static, from: "priv/static", at: "/static"
  plug Plug.Parsers, parsers: [:json], pass:  ["application/json"], json_decoder: Poison
  plug(:dispatch)

  get "/api/accounts" do
    IO.puts "api/accounts"
    accounts = Enum.map(Server.Database.get_accounts, fn {id, last_name, first_name, balance, last_update, _history}-> %{"id" => id, "last_name" => last_name, "first_name" => first_name, "balance" => balance, "last_update" => last_update} end)
    body = Poison.encode!(accounts)
    send_resp(conn, 200, body)
  end

  post "/api/account" do
    Process.sleep(1000)
    IO.puts "post api/account"
    Server.Database.create_account({conn.body_params["last_name"], conn.body_params["first_name"], conn.body_params["balance"]})
    send_resp(conn, 200, Poison.encode!(%{"ok" => "ok"}))
  end

  put "api/account/:id" do
    Process.sleep(1000)
    {id, _last_name, _first_name, _balance, last_upt, history} = hd(Server.Database.get_account(id))
    account = {id, conn.body_params["last_name"], conn.body_params["first_name"], conn.body_params["balance"], last_upt, history}
    Server.Database.update_account(account)
    body = Poison.encode!(%{"ok" => "ok"})
    send_resp(conn, 200, body)
  end

  delete "/api/account/:id" do
    IO.puts("delete " <> id)
    Process.sleep(1000)
    Server.Database.delete_account({id})
    body = Poison.encode!(%{"ok" => "ok"})
    send_resp(conn, 200, body)
  end

  get _ do
    send_file(conn, 200, "priv/static/index.html")
  end

end

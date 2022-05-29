import server from "../example/server";
import * as request from "supertest";

describe("Test hasura events", () => {

  it("Test failed update_user event", (done) => {
    const email = "example@domain.com";
    const password = "123456";

    void request(server)
      .post("/events")
      .send({ email, password })
      .expect("Content-Type", /application\/json/)
      .expect(400)
      .end((err, res) => {
        if (err) {
          return done(err);
        }

        expect(res.body.message).toEqual("empty hasura event trigger id");

        return done();
      });

  });

  it("Test success update_user event", (done) => {
    const email = "example@domain.com";
    const password = "123456";

    void request(server)
      .post("/events")
      .send({
        id: new Date().toISOString(),
        event: {
          session_variables: {
            "x-hasura-role": "admin"
          },
          op: "UPDATE",
          data: {
            old: { email, password },
            new: { email, password }
          }
        },
        created_at: new Date().toISOString(),
        trigger: {
          name: "update_user"
        },
        table: {
          name: "users",
          schema: "public"
        }
      })
      .expect("Content-Type", /application\/json/)
      .expect(200)
      .end((err, res) => {
        if (err) {
          return done(err);
        }

        expect(res.body.email).toEqual(email);
        expect(res.body.password).toEqual(password);

        return done();
      });

  });

  it("Test success scheduled trigger", (done) => {
    void request(server)
      .post("/schedulers")
      .send({
        scheduled_time: "2022-05-29T09:56:00Z",
        payload: {},
        name: "hello",
        id: "2b7108a1-8497-42b6-9295-3a8578c85d0b"
    })
      .expect("Content-Type", /application\/json/)
      .expect(200)
      .end((err, res) => {
        if (err) {
          return done(err);
        }
        expect(res.body.hello).toEqual("world");

        return done();
      });

  });
});

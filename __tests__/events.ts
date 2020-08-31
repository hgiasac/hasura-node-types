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
});

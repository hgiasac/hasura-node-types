import server from "../example/server";
import * as request from "supertest";

describe("Test hasura actions", () => {

  it("Test failed login action", (done) => {
    const email = "example@domain.com";
    const password = "123456";
    void request(server)
      .post("/actions")
      .send({ email, password })
      .expect("Content-Type", /application\/json/)
      .expect(400)
      .end((err, res) => {

        if (err) {
          return done(err);
        }

        expect(res.body.message).toEqual("empty hasura action name");

        return done();
      });

  });

  it("Test success login action event", (done) => {
    const email = "example@domain.com";
    const password = "123456";

    void request(server)
      .post("/actions")
      .send({
        input: { email, password },
        created_at: new Date(),
        session_variables: {
          "x-hasura-role": "anonymous"
        },
        action: {
          name: "login"
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

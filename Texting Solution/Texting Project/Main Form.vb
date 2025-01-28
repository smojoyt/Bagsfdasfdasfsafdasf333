Public Class Form1
    Private Sub btnExit_Click(sender As Object, e As EventArgs) Handles btnExit.Click
        Me.Close()

    End Sub

    Private Sub picBFF_Click(sender As Object, e As EventArgs) Handles picBFF.Click
        lblMeaning.Text = "Best Friends Forever"
    End Sub

    Private Sub picBRB_Click(sender As Object, e As EventArgs) Handles picBRB.Click
        lblMeaning.Text = "Be Right Back"
    End Sub

    Private Sub picIDK_Click(sender As Object, e As EventArgs) Handles picIDK.Click
        lblMeaning.Text = "I Dont Know"
    End Sub

    Private Sub picLOL_Click(sender As Object, e As EventArgs) Handles picLOL.Click
        lblMeaning.Text = "Laugh Out Loud"
    End Sub

    Private Sub picSRY_Click(sender As Object, e As EventArgs) Handles picSRY.Click
        lblMeaning.Text = "Sorry"
    End Sub

    Private Sub picXO_Click(sender As Object, e As EventArgs) Handles picXO.Click
        lblMeaning.Text = "Kisses"
    End Sub
End Class

